/* ------------------------------------------------------------------ */
/*  Firebase — kiosk-shopping                                          */
/*  The SDK loads lazily (code-split chunk) so the shop shell stays    */
/*  light; every helper below is safe to call before it resolves.      */
/* ------------------------------------------------------------------ */

const firebaseConfig = {
  apiKey: "AIzaSyAISVtyphO1eRggAcoEJRjIA-Ow2TZqsAQ",
  authDomain: "kiosk-shopping-ad738.firebaseapp.com",
  projectId: "kiosk-shopping-ad738",
  storageBucket: "kiosk-shopping-ad738.firebasestorage.app",
  messagingSenderId: "926649050387",
  appId: "1:926649050387:web:a197d416c328c7acc366e6",
  measurementId: "G-45CQX9ZGLL",
};

interface Sdk {
  analytics: import("firebase/analytics").Analytics | null;
  fdb: import("firebase/firestore").Firestore;
  auth: import("firebase/auth").Auth;
  authMod: typeof import("firebase/auth");
  doc: typeof import("firebase/firestore").doc;
  getDoc: typeof import("firebase/firestore").getDoc;
  setDoc: typeof import("firebase/firestore").setDoc;
  logEvent: typeof import("firebase/analytics").logEvent;
}

let sdkPromise: Promise<Sdk> | null = null;

function loadSdk(): Promise<Sdk> {
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
      import("firebase/analytics"),
    ])
      .then(async ([appMod, authMod, fsMod, anMod]) => {
        const app = appMod.initializeApp(firebaseConfig);
        let analytics: Sdk["analytics"] = null;
        try {
          if (await anMod.isSupported()) analytics = anMod.getAnalytics(app);
        } catch {
          analytics = null;
        }
        return {
          analytics,
          fdb: fsMod.getFirestore(app),
          auth: authMod.getAuth(app),
          authMod,
          doc: fsMod.doc,
          getDoc: fsMod.getDoc,
          setDoc: fsMod.setDoc,
          logEvent: anMod.logEvent,
        };
      })
      .catch((e) => {
        sdkPromise = null; // allow retry on next call
        throw e;
      });
  }
  return sdkPromise;
}

/* eagerly kick off the load so it's warm by first use */
if (typeof window !== "undefined") {
  window.setTimeout(() => {
    loadSdk().catch(() => {});
  }, 400);
}

/** Fire-and-forget analytics event. Safe to call anywhere. */
export function track(name: string, params?: Record<string, string | number>) {
  loadSdk()
    .then((sdk) => {
      if (sdk.analytics) sdk.logEvent(sdk.analytics, name, params);
    })
    .catch(() => {
      /* analytics must never break the shop */
    });
}

/* ------------------------------------------------------------------ */
/*  Authentication — real Firebase Auth (email/password + Google)      */
/* ------------------------------------------------------------------ */

export interface AuthSession {
  uid: string;
  email: string | null;
  name: string;
  provider: "password" | "google";
}

const toSession = (u: import("firebase/auth").User, nameOverride?: string): AuthSession => ({
  uid: u.uid,
  email: u.email,
  name: nameOverride || u.displayName || (u.email ? u.email.split("@")[0] : "Member"),
  provider: u.providerData.some((p) => p.providerId === "google.com") ? "google" : "password",
});

/** Subscribe to the Firebase auth state. The callback fires once immediately. */
export function onAuthChange(cb: (s: AuthSession | null) => void): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;
  loadSdk()
    .then((sdk) => {
      if (cancelled) return;
      unsub = sdk.authMod.onAuthStateChanged(sdk.auth, (u) => cb(u ? toSession(u) : null));
    })
    .catch(() => {
      if (!cancelled) cb(null);
    });
  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function signInWithEmail(email: string, pass: string): Promise<AuthSession> {
  const sdk = await loadSdk();
  const cred = await sdk.authMod.signInWithEmailAndPassword(sdk.auth, email, pass);
  return toSession(cred.user);
}

export async function signUpWithEmail(email: string, pass: string, name: string): Promise<AuthSession> {
  const sdk = await loadSdk();
  const cred = await sdk.authMod.createUserWithEmailAndPassword(sdk.auth, email, pass);
  try {
    await sdk.authMod.updateProfile(cred.user, { displayName: name });
  } catch {
    /* profile name is cosmetic — never block signup on it */
  }
  return toSession(cred.user, name);
}

export async function signInWithGoogle(): Promise<{ session: AuthSession; isNew: boolean }> {
  const sdk = await loadSdk();
  const provider = new sdk.authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await sdk.authMod.signInWithPopup(sdk.auth, provider);
  return { session: toSession(cred.user), isNew: cred.operationType !== "signIn" };
}

export async function signOutFirebase(): Promise<void> {
  const sdk = await loadSdk();
  await sdk.authMod.signOut(sdk.auth);
}

export async function sendResetEmail(email: string): Promise<void> {
  const sdk = await loadSdk();
  await sdk.authMod.sendPasswordResetEmail(sdk.auth, email);
}

export async function updateDisplayName(name: string): Promise<void> {
  const sdk = await loadSdk();
  const u = sdk.auth.currentUser;
  if (u) await sdk.authMod.updateProfile(u, { displayName: name });
}

/** Translate Firebase auth error codes into stall-front language. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password doesn't match our ledger. Try again or reset it.";
    case "auth/email-already-in-use":
      return "That email already has a stall here — try signing in instead.";
    case "auth/account-exists-with-different-credential":
      return "That Google email is already registered with a password — sign in with email instead.";
    case "auth/weak-password":
      return "Password is too flimsy — use at least 6 characters.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts — take a breath and try again in a minute.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google popup closed before sign-in finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup — allow popups for this site and retry.";
    case "auth/network-request-failed":
      return "Network hiccup — check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is currently switched off. Contact the market admin.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return e instanceof Error && e.message ? e.message : "Something went wrong — please try again.";
  }
}

/* ------------------------------------------------------------------ */
/*  Cloud sync: local-first store, Firestore as the backup ledger      */
/* ------------------------------------------------------------------ */
export interface CloudState {
  connected: boolean;
  lastSync: number | null;
  lastError: string | null;
  pushing: boolean;
}

let cloudState: CloudState = { connected: false, lastSync: null, lastError: null, pushing: false };
const listeners = new Set<() => void>();

function setCloudState(patch: Partial<CloudState>) {
  cloudState = { ...cloudState, ...patch };
  listeners.forEach((l) => l());
}

export function getCloudState(): CloudState {
  return cloudState;
}

export function subscribeCloudState(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

let pushTimer: number | null = null;

/** Debounced background push of the whole market state to Firestore. */
export function pushToCloud(data: unknown) {
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void flushToCloud(data);
  }, 1500);
}

export async function flushToCloud(data: unknown): Promise<boolean> {
  setCloudState({ pushing: true });
  try {
    const sdk = await loadSdk();
    const ref = sdk.doc(sdk.fdb, "kiosk", "market-state");
    await sdk.setDoc(ref, {
      data: JSON.parse(JSON.stringify(data)),
      updatedAt: Date.now(),
      rev: (cloudState.lastSync ?? 0) + 1,
    });
    setCloudState({ connected: true, pushing: false, lastSync: Date.now(), lastError: null });
    track("cloud_sync", { at: Date.now() });
    return true;
  } catch (e) {
    setCloudState({
      connected: false,
      pushing: false,
      lastError: e instanceof Error ? e.message.slice(0, 90) : "network unreachable",
    });
    return false;
  }
}

/** One-shot hydration for fresh devices: pull the market state if nothing local exists. */
export async function hydrateFromCloud(): Promise<{ data: unknown; updatedAt: number } | null> {
  try {
    const sdk = await loadSdk();
    const snap = await sdk.getDoc(sdk.doc(sdk.fdb, "kiosk", "market-state"));
    if (!snap.exists()) return null;
    const payload = snap.data() as { data?: unknown; updatedAt?: number };
    if (!payload || typeof payload !== "object" || !payload.data) return null;
    return { data: payload.data, updatedAt: payload.updatedAt ?? Date.now() };
  } catch {
    return null;
  }
}
