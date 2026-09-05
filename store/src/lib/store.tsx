import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AVATAR_COLORS, seedDB, uid } from "./data";
import type { Address, CartLine, DB, Order, OrderStatus, Product, Review, Role, SellerProfile, User } from "./data";
import {
  authErrorMessage,
  hydrateFromCloud,
  onAuthChange,
  pushToCloud,
  sendResetEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutFirebase,
  signUpWithEmail,
  track,
  updateDisplayName,
} from "./firebase";
import type { AuthSession } from "./firebase";

const LS_KEY = "kiosk.db.v5";

/* ---------------- toast ---------------- */
export type ToastKind = "success" | "error" | "info";
export interface ToastMsg {
  id: string;
  kind: ToastKind;
  text: string;
}

/* ---------------- auth result ---------------- */
export type AuthResult =
  | { ok: true; role: Role; name: string; founder: boolean }
  | { ok: false; error: string };

/* ---------------- store shape ---------------- */
interface Store {
  db: DB;
  user: User | null;
  authReady: boolean;
  toasts: ToastMsg[];
  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;

  toast: (text: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;

  login: (email: string, pass: string) => Promise<AuthResult>;
  signup: (name: string, email: string, pass: string, role: Role, seller?: SellerProfile | null) => Promise<AuthResult>;
  googleSignIn: (preferredRole: Role) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<string | null>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "address">>) => void;
  openStall: (details: SellerProfile) => Promise<{ ok: true } | { ok: false; error: string }>;

  toggleWish: (productId: string) => void;
  isWished: (productId: string) => boolean;

  addToCart: (productId: string, qty?: number, openDrawer?: boolean) => void;
  setCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;

  placeOrder: (address: Address, last4: string) => Promise<Order>;
  advanceOrder: (orderId: string, status: OrderStatus) => void;

  saveProduct: (data: Omit<Product, "id" | "sellerId" | "sold" | "createdAt" | "featured">, id?: string) => void;
  deleteProduct: (id: string) => void;
  toggleFeatured: (id: string) => void;

  addReview: (productId: string, rating: number, text: string) => void;
  canReview: (productId: string) => boolean;

  setUserRole: (userId: string, role: Role) => void;
  toggleBlocked: (userId: string) => void;
  updateSettings: (patch: Partial<DB["settings"]>) => void;
}

const Ctx = createContext<Store | null>(null);

const load = (): DB => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return seedDB();
    const parsed = JSON.parse(raw) as DB;
    if (!parsed || parsed.v !== 5 || !Array.isArray(parsed.users)) return seedDB();
    return parsed;
  } catch {
    return seedDB();
  }
};

/**
 * Idempotently attach a Firebase identity to the market ledger: create the
 * member profile on first sign-in (the very first real member receives the
 * founder/admin keys) and fold the guest crate into the member's crate.
 */
function ensureProfile(
  d: DB,
  s: AuthSession,
  preferred?: { role: Role; name?: string; seller?: SellerProfile | null },
): { db: DB; profile: User; created: boolean; founder: boolean } {
  const existing = d.users.find((u) => u.id === s.uid);
  if (existing) {
    return { db: d, profile: existing, created: false, founder: false };
  }
  const founder = !d.users.some((u) => !u.legacy);
  const role: Role = founder ? "admin" : preferred?.role ?? "buyer";
  const profile: User = {
    id: s.uid,
    name: preferred?.name?.trim() || s.name || "New Member",
    email: (s.email ?? "").toLowerCase(),
    provider: s.provider,
    role,
    blocked: false,
    legacy: false,
    /* founders take the admin desk; everyone else keeps the stall they asked for */
    seller: role === "seller" ? preferred?.seller ?? null : null,
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    joined: Date.now(),
    address: { line1: "", city: "", zip: "", country: "USA" },
  };
  const guest = d.carts["guest"] ?? [];
  const mine = [...(d.carts[s.uid] ?? [])];
  for (const line of guest) {
    const ex = mine.find((l) => l.productId === line.productId);
    if (ex) ex.qty = Math.min(99, ex.qty + line.qty);
    else mine.push(line);
  }
  return {
    db: {
      ...d,
      users: [...d.users, profile],
      carts: { ...d.carts, [s.uid]: mine, guest: [] },
    },
    profile,
    created: true,
    founder,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const timers = useRef<Record<string, number>>({});

  /* live references for callbacks that must never read stale state */
  const dbRef = useRef(db);
  const welcomedUid = useRef<string | null>(null);
  const booted = useRef(false);
  /* intent is parked before the Firebase await so the auth listener and the
     awaiting action can never disagree about role, name or toasts */
  const pendingPreferred = useRef<{ role: Role; name?: string; seller?: SellerProfile | null } | null>(null);
  const suppressToast = useRef(false);

  useEffect(() => {
    dbRef.current = db;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch {
      /* storage full / private mode — keep running in memory */
    }
    pushToCloud(db); // debounced Firestore backup
  }, [db]);

  /* fresh device → adopt the cloud ledger if it exists */
  useEffect(() => {
    let cancelled = false;
    if (!window.localStorage.getItem(LS_KEY)) {
      hydrateFromCloud().then((remote) => {
        if (cancelled || !remote) return;
        const parsed = remote.data as DB;
        if (parsed && parsed.v === 5 && Array.isArray(parsed.users)) {
          dbRef.current = parsed;
          setDb(parsed);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), []);

  const toast = useCallback((text: string, kind: ToastKind = "success") => {
    const id = uid("t");
    setToasts((prev) => [...prev.slice(-3), { id, kind, text }]);
    timers.current[id] = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const commitProfile = useCallback((s: AuthSession, preferred?: { role: Role; name?: string; seller?: SellerProfile | null }) => {
    const res = ensureProfile(dbRef.current, s, preferred);
    if (res.created) {
      dbRef.current = res.db;
      setDb(res.db);
      track("sign_up", { method: s.provider, role: res.profile.role });
    }
    return res;
  }, []);

  /* ---------------- Firebase auth subscription ---------------- */
  useEffect(
    () =>
      onAuthChange((s) => {
        setAuthSession(s);
        setAuthReady(true);
        if (!s) {
          welcomedUid.current = null;
          booted.current = true;
          return;
        }
        const firstEmission = !booted.current;
        booted.current = true;

        const res = ensureProfile(dbRef.current, s, pendingPreferred.current ?? undefined);
        pendingPreferred.current = null;
        const quiet = suppressToast.current;
        suppressToast.current = false;
        if (res.created) {
          dbRef.current = res.db;
          setDb(res.db);
          track("sign_up", { method: s.provider, role: res.profile.role });
        }

        if (res.profile.blocked) {
          welcomedUid.current = null;
          void signOutFirebase().catch(() => {});
          if (!quiet) toast("This account has been suspended by the market admin.", "error");
          return;
        }

        /* sign-ins handled by login/signup/google already toasted; this path
           covers persisted sessions restored in a fresh tab or browser */
        if (!firstEmission && !quiet && welcomedUid.current !== s.uid) {
          toast(`Welcome back, ${res.profile.name.split(" ")[0]}.`);
        }
        welcomedUid.current = s.uid;
      }),
    [toast],
  );

  const user = useMemo(
    () => (authSession ? db.users.find((u) => u.id === authSession.uid) ?? null : null),
    [db.users, authSession],
  );
  const cartKey = user ? user.id : "guest";
  const cart = db.carts[cartKey] ?? [];

  /* ---------------- auth actions ---------------- */

  const finishSignIn = useCallback(
    (
      s: AuthSession,
      opts: {
        method: "email" | "google";
        intent: "signin" | "signup";
        preferred?: { role: Role; name?: string; seller?: SellerProfile | null };
      },
    ): AuthResult => {
      const res = commitProfile(s, opts.preferred);
      if (res.profile.blocked) {
        welcomedUid.current = null;
        void signOutFirebase().catch(() => {});
        return { ok: false, error: "This account has been suspended by the market admin." };
      }
      welcomedUid.current = s.uid;
      track("login", { method: opts.method, role: res.profile.role });
      if (opts.intent === "signup" && res.profile.role === "admin" && res.founder) {
        toast("Stall opened — as the first member, the admin keys are yours.");
      } else if (opts.intent === "signup" && res.profile.seller?.stallName) {
        toast(`“${res.profile.seller.stallName}” is open on the floor — welcome to KIOSK!`);
      } else if (opts.intent === "signup") {
        toast(`Stall opened — welcome to KIOSK, ${res.profile.name.split(" ")[0]}!`);
      } else {
        toast(`Welcome back, ${res.profile.name.split(" ")[0]}.`);
      }
      return { ok: true, role: res.profile.role, name: res.profile.name, founder: res.founder && res.created };
    },
    [commitProfile, toast],
  );

  const login = useCallback(
    async (email: string, pass: string): Promise<AuthResult> => {
      try {
        const s = await signInWithEmail(email.trim().toLowerCase(), pass);
        return finishSignIn(s, { method: "email", intent: "signin" });
      } catch (e) {
        return { ok: false, error: authErrorMessage(e) };
      }
    },
    [finishSignIn],
  );

  const signup = useCallback(
    async (name: string, email: string, pass: string, role: Role, seller?: SellerProfile | null): Promise<AuthResult> => {
      pendingPreferred.current = { role, name: name.trim(), seller };
      suppressToast.current = true;
      try {
        const s = await signUpWithEmail(email.trim().toLowerCase(), pass, name.trim());
        return finishSignIn(s, { method: "email", intent: "signup", preferred: { role, name, seller } });
      } catch (e) {
        pendingPreferred.current = null;
        suppressToast.current = false;
        return { ok: false, error: authErrorMessage(e) };
      }
    },
    [finishSignIn],
  );

  const googleSignIn = useCallback(
    async (preferredRole: Role): Promise<AuthResult> => {
      pendingPreferred.current = { role: preferredRole };
      suppressToast.current = true;
      try {
        const { session: s, isNew } = await signInWithGoogle();
        pendingPreferred.current = { role: preferredRole, name: s.name };
        return finishSignIn(s, {
          method: "google",
          intent: isNew ? "signup" : "signin",
          preferred: { role: preferredRole, name: s.name },
        });
      } catch (e) {
        pendingPreferred.current = null;
        suppressToast.current = false;
        return { ok: false, error: authErrorMessage(e) };
      }
    },
    [finishSignIn],
  );

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    try {
      await sendResetEmail(email.trim().toLowerCase());
      return null;
    } catch (e) {
      return authErrorMessage(e);
    }
  }, []);

  const logout = useCallback(() => {
    void signOutFirebase()
      .then(() => toast("Signed out. The floor keeps your cart warm.", "info"))
      .catch(() => toast("Couldn't reach Firebase to sign out.", "error"));
  }, [toast]);

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, "name" | "address">>) => {
      const me = authSession?.uid;
      if (!me) return;
      if (patch.name) void updateDisplayName(patch.name).catch(() => {});
      setDb((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === me ? { ...u, ...patch } : u)),
      }));
      toast("Profile updated.");
    },
    [authSession, toast],
  );

  /**
   * Buyer → seller conversion. Stamps the stall details onto the member's
   * profile and flips their role so the Seller Studio unlocks.
   */
  const openStall = useCallback(
    (details: SellerProfile): Promise<{ ok: true } | { ok: false; error: string }> => {
      const me = authSession?.uid;
      if (!me) return Promise.resolve({ ok: false, error: "Sign in first, then open your stall." });
      const existing = dbRef.current.users.find((u) => u.id === me);
      if (!existing) return Promise.resolve({ ok: false, error: "Account not found on the ledger." });
      if (existing.blocked) return Promise.resolve({ ok: false, error: "This account has been suspended by the market admin." });
      if (existing.role === "admin") return Promise.resolve({ ok: false, error: "Admins run the floor — no stall needed." });

      setDb((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === me ? { ...u, role: "seller", seller: details } : u)),
      }));
      track("open_stall", { business_type: details.businessType, categories: details.categories.length });
      toast(`“${details.stallName}” is open on the floor. Welcome to the seller side!`);
      return Promise.resolve({ ok: true });
    },
    [authSession, toast],
  );

  /* ---------------- wishlist ---------------- */
  const isWished = useCallback(
    (productId: string) => !!user && (db.wishlists[user.id] ?? []).includes(productId),
    [db.wishlists, user],
  );

  const toggleWish = useCallback(
    (productId: string) => {
      if (!user) {
        toast("Sign in to keep a wishlist.", "info");
        return;
      }
      setDb((d) => {
        const list = d.wishlists[user.id] ?? [];
        const has = list.includes(productId);
        return {
          ...d,
          wishlists: { ...d.wishlists, [user.id]: has ? list.filter((p) => p !== productId) : [...list, productId] },
        };
      });
    },
    [user, toast],
  );

  /* ---------------- cart ---------------- */
  const addToCart = useCallback(
    (productId: string, qty = 1, openDrawer = true) => {
      const product = db.products.find((p) => p.id === productId);
      if (!product) return;
      if (product.stock <= 0) {
        toast("That piece is sold out — wishlist it for the restock.", "error");
        return;
      }
      setDb((d) => {
        const key = authSession?.uid ?? "guest";
        const lines = [...(d.carts[key] ?? [])];
        const ex = lines.find((l) => l.productId === productId);
        const nextQty = Math.min(product.stock, (ex?.qty ?? 0) + qty);
        if (ex) ex.qty = nextQty;
        else lines.push({ productId, qty: Math.min(product.stock, qty) });
        return { ...d, carts: { ...d.carts, [key]: lines } };
      });
      track("add_to_cart", { item_id: productId, value: product.price, currency: "USD" });
      toast(`${product.name} added to your crate.`);
      if (openDrawer) setCartOpen(true);
    },
    [db.products, authSession, toast],
  );

  const setCartQty = useCallback(
    (productId: string, qty: number) => {
      const product = db.products.find((p) => p.id === productId);
      const max = product ? Math.max(1, product.stock) : 99;
      setDb((d) => {
        const key = authSession?.uid ?? "guest";
        const lines = (d.carts[key] ?? []).map((l) =>
          l.productId === productId ? { ...l, qty: Math.max(1, Math.min(max, qty)) } : l,
        );
        return { ...d, carts: { ...d.carts, [key]: lines } };
      });
    },
    [db.products, authSession],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setDb((d) => {
        const key = authSession?.uid ?? "guest";
        return { ...d, carts: { ...d.carts, [key]: (d.carts[key] ?? []).filter((l) => l.productId !== productId) } };
      });
    },
    [authSession],
  );

  /* ---------------- orders ---------------- */
  const placeOrder = useCallback(
    (address: Address, last4: string): Promise<Order> => {
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (!user) {
            reject(new Error("Sign in to check out."));
            return;
          }
          const lines = db.carts[user.id] ?? [];
          if (lines.length === 0) {
            reject(new Error("Your crate is empty."));
            return;
          }
          const items = lines.flatMap((l) => {
            const p = db.products.find((x) => x.id === l.productId);
            return p
              ? [{ productId: p.id, name: p.name, image: p.image, qty: l.qty, price: p.price, sellerId: p.sellerId }]
              : [];
          });
          const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
          const fee = +(subtotal * db.settings.commission).toFixed(2);
          const order: Order = {
            id: `KO-${1000 + Math.floor(Math.random() * 9000)}`,
            buyerId: user.id,
            buyerName: user.name,
            items,
            subtotal,
            fee,
            total: subtotal,
            status: "pending",
            placedAt: Date.now(),
            timeline: [{ status: "pending", at: Date.now() }],
            address,
            paymentLast4: last4,
          };
          setDb((d) => ({
            ...d,
            orders: [order, ...d.orders],
            products: d.products.map((p) => {
              const line = lines.find((l) => l.productId === p.id);
              return line ? { ...p, stock: Math.max(0, p.stock - line.qty), sold: p.sold + line.qty } : p;
            }),
            carts: { ...d.carts, [user.id]: [] },
          }));
          track("purchase", { transaction_id: order.id, value: order.total, currency: "USD", items: order.items.length });
          resolve(order);
        }, 900);
      });
    },
    [db, user],
  );

  const advanceOrder = useCallback(
    (orderId: string, status: OrderStatus) => {
      setDb((d) => {
        const orders = d.orders.map((o) => {
          if (o.id !== orderId) return o;
          if (o.status === "canceled" || o.status === "delivered") return o;
          return { ...o, status, timeline: [...o.timeline, { status, at: Date.now() }] };
        });
        const order = orders.find((o) => o.id === orderId);
        let products = d.products;
        if (order && status === "canceled") {
          products = d.products.map((p) => {
            const line = order.items.find((i) => i.productId === p.id);
            return line ? { ...p, stock: p.stock + line.qty, sold: Math.max(0, p.sold - line.qty) } : p;
          });
        }
        return { ...d, orders, products };
      });
      toast(`Order ${orderId} marked ${status}.`, status === "canceled" ? "info" : "success");
    },
    [toast],
  );

  /* ---------------- products (seller) ---------------- */
  const saveProduct = useCallback(
    (data: Omit<Product, "id" | "sellerId" | "sold" | "createdAt" | "featured">, id?: string) => {
      setDb((d) => {
        if (id) {
          return {
            ...d,
            products: d.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
          };
        }
        /* new listings always belong to the signed-in keeper */
        if (!authSession?.uid) return d;
        const p: Product = {
          ...data,
          id: uid("p"),
          sellerId: authSession.uid,
          sold: 0,
          featured: false,
          createdAt: Date.now(),
        };
        return { ...d, products: [p, ...d.products] };
      });
      toast(id ? "Listing updated." : "New listing is live on the floor.");
    },
    [authSession, toast],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setDb((d) => ({
        ...d,
        products: d.products.filter((p) => p.id !== id),
        carts: Object.fromEntries(
          Object.entries(d.carts).map(([k, lines]) => [k, lines.filter((l) => l.productId !== id)]),
        ),
        wishlists: Object.fromEntries(
          Object.entries(d.wishlists).map(([k, list]) => [k, list.filter((p) => p !== id)]),
        ),
      }));
      toast("Listing removed from the floor.", "info");
    },
    [toast],
  );

  const toggleFeatured = useCallback((id: string) => {
    setDb((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p)),
    }));
  }, []);

  /* ---------------- reviews ---------------- */
  const canReview = useCallback(
    (productId: string) => {
      if (!user) return false;
      const bought = db.orders.some(
        (o) => o.buyerId === user.id && o.status === "delivered" && o.items.some((i) => i.productId === productId),
      );
      const reviewed = db.reviews.some((r) => r.productId === productId && r.userId === user.id);
      return bought && !reviewed;
    },
    [db.orders, db.reviews, user],
  );

  const addReview = useCallback(
    (productId: string, rating: number, text: string) => {
      if (!user) return;
      const r: Review = {
        id: uid("r"),
        productId,
        userId: user.id,
        userName: user.name,
        rating,
        text: text.trim(),
        at: Date.now(),
      };
      setDb((d) => ({ ...d, reviews: [r, ...d.reviews] }));
      toast("Review posted — thanks for the word on the street.");
    },
    [user, toast],
  );

  /* ---------------- admin ---------------- */
  const setUserRole = useCallback(
    (userId: string, role: Role) => {
      setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === userId && !u.legacy ? { ...u, role } : u)) }));
      toast("Role updated.", "info");
    },
    [toast],
  );

  const toggleBlocked = useCallback(
    (userId: string) => {
      const target = dbRef.current.users.find((u) => u.id === userId);
      if (!target || target.legacy) return;
      const willBlock = !target.blocked;
      setDb((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === userId ? { ...u, blocked: willBlock } : u)),
      }));
      if (willBlock && authSession?.uid === userId) {
        void signOutFirebase().catch(() => {});
      }
      toast(willBlock ? "Member suspended." : "Member reinstated.", "info");
    },
    [authSession, toast],
  );

  const updateSettings = useCallback(
    (patch: Partial<DB["settings"]>) => {
      setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
      toast("Market settings saved.");
    },
    [toast],
  );

  const value: Store = {
    db,
    user,
    authReady,
    toasts,
    cart,
    cartOpen,
    setCartOpen,
    toast,
    dismissToast,
    login,
    signup,
    googleSignIn,
    resetPassword,
    logout,
    updateProfile,
    openStall,
    toggleWish,
    isWished,
    addToCart,
    setCartQty,
    removeFromCart,
    placeOrder,
    advanceOrder,
    saveProduct,
    deleteProduct,
    toggleFeatured,
    addReview,
    canReview,
    setUserRole,
    toggleBlocked,
    updateSettings,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/* ---------------- tiny hash router ---------------- */
export interface Route {
  path: string;
  parts: string[];
  query: URLSearchParams;
}

export const parseHash = (): Route => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  return { path: pathPart || "/", parts, query: new URLSearchParams(queryPart ?? "") };
};

export const navigate = (to: string) => {
  window.location.hash = to;
};
