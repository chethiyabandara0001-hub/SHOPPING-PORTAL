import { useEffect, useRef, useState } from "react";
import { navigate, useStore } from "../lib/store";
import type { Route } from "../lib/store";
import { CATEGORIES } from "../lib/data";
import type { Role, SellerProfile } from "../lib/data";
import { Field, inputCls, Spinner } from "../components/ui";
import { IconArrowRight, IconCheck, IconEye, IconShield, IconSpark, IconStore, IconTag, IconUser, Logo } from "../components/Icons";

function GoogleGlyph({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthPage({ route }: { route: Route }) {
  const { user, authReady, login, signup, googleSignIn, resetPassword } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">(route.query.get("mode") === "signup" ? "signup" : "signin");
  const next = route.query.get("next");

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>(route.query.get("role") === "seller" ? "seller" : "buyer");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"" | "email" | "google" | "reset">("");
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState("");
  const redirected = useRef(false);

  /* extra stall details collected when signing up as a seller */
  const [stall, setStall] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState<"individual" | "registered">("individual");
  const [sCity, setSCity] = useState("");
  const [sCountry, setSCountry] = useState("USA");
  const [sCats, setSCats] = useState<string[]>([]);

  const afterAuth = (r: Role, viaGoogle = false) => {
    if (next === "checkout") navigate("/checkout");
    else if (next === "account") navigate("/account");
    else if (next === "onboarding") navigate("/onboarding");
    else if (r === "seller") navigate(viaGoogle ? "/onboarding" : "/seller");
    else if (r === "admin") navigate("/admin");
    else navigate("/");
  };

  /* already signed in (e.g. returning via back button) → send them along */
  useEffect(() => {
    if (authReady && user && !redirected.current) {
      redirected.current = true;
      afterAuth(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user]);

  const sellerDetails = (): SellerProfile => ({
    stallName: stall.trim(),
    businessType,
    phone: phone.trim(),
    city: sCity.trim(),
    country: sCountry.trim(),
    categories: sCats,
    bio: "",
    payout: { method: "bank", detail: "" },
    createdAt: Date.now(),
  });

  const submit = async () => {
    if (busy) return;
    const fe: Record<string, string> = {};
    const isSellerSignup = mode === "signup" && role === "seller";
    if (mode === "signup" && name.trim().length < 2) fe.name = "Tell us who's behind the stall.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) fe.email = "That doesn't look like an email.";
    if (pass.length < 6) fe.pass = "Minimum 6 characters.";
    if (isSellerSignup) {
      if (stall.trim().length < 2) fe.stall = "Give your stall a name (2+ characters).";
      if (phone.replace(/\D/g, "").length < 7) fe.phone = "A reachable phone number (7+ digits).";
      if (!sCity.trim()) fe.sCity = "Where does your stock ship from?";
      if (!sCountry.trim()) fe.sCountry = "Country is required.";
      if (sCats.length === 0) fe.sCats = "Pick at least one aisle.";
    }
    setFieldErr(fe);
    if (Object.keys(fe).length) return;

    setError("");
    setBusy("email");
    const res = mode === "signin" ? await login(email, pass) : await signup(name, email, pass, role, isSellerSignup ? sellerDetails() : null);
    setBusy("");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    afterAuth(res.role);
  };

  const google = async () => {
    if (busy) return;
    setError("");
    setBusy("google");
    const res = await googleSignIn(role);
    setBusy("");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    /* Google can't collect stall details in the popup, so seller sign-ups
       finish their stall profile in the onboarding wizard */
    afterAuth(res.role, role === "seller" && mode === "signup");
  };

  const requestReset = async () => {
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldErr({ email: "Enter your account email first, then tap the reset link." });
      return;
    }
    setFieldErr({});
    setBusy("reset");
    const err = await resetPassword(email);
    setBusy("");
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setResetSent(email.trim());
    setForgot(false);
  };

  const switchMode = (m: "signin" | "signup") => {
    setMode(m);
    setError("");
    setResetSent("");
    setForgot(false);
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-[1080px] items-center gap-12 px-4 py-14 lg:grid-cols-[1fr_440px] lg:px-6">
      {/* left pitch */}
      <div className="anim-rise hidden lg:block">
        <p className="font-mono text-[11.5px] font-bold uppercase tracking-[0.16em] text-pine">Members' entrance</p>
        <h1 className="font-display mt-4 text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.02] tracking-tight">
          One ledger.
          <br />
          Two sides of
          <br />
          <span className="relative">
            the counter.
            <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 260 10" fill="none" preserveAspectRatio="none">
              <path d="M3 7c50-5 150-6 254-3" stroke="#F2A614" strokeWidth="4.5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <div className="mt-8 space-y-4">
          {[
            { icon: <IconUser size={17} />, t: "Buyers", s: "Track crates, orders and wishlists; review what you've lived with." },
            { icon: <IconStore size={17} />, t: "Sellers", s: "A full studio — listings, live stock, order flow and net earnings." },
            { icon: <IconShield size={17} />, t: "Admins", s: "Run the floor: users, moderation, fees and the megaphone." },
          ].map((b) => (
            <div key={b.t} className="flex items-start gap-3.5 rounded-xl border border-line bg-card p-4 transition hover:border-pine/40">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-pinesoft text-pine">{b.icon}</span>
              <div>
                <p className="font-display text-[15.5px] font-extrabold">{b.t}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-inksoft">{b.s}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-amber/40 bg-ambersoft/60 p-4">
          <IconSpark size={18} className="shrink-0 text-[#8a5c05]" />
          <p className="text-[13px] font-semibold leading-relaxed text-[#6d4a04]">
            Accounts are secured by Firebase Authentication — sign in with Google or an email and password. Passwords
            never touch our ledger.
          </p>
        </div>
      </div>

      {/* form */}
      <div className="anim-rise mx-auto w-full max-w-[440px]" style={{ animationDelay: "90ms" }}>
        <div className="rounded-xl border border-line bg-card p-6 shadow-[var(--shadow-lift)] sm:p-7">
          <div className="flex items-center gap-3">
            <Logo size={38} />
            <div>
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                {mode === "signin" ? "Back to the floor" : "Join the market"}
              </h2>
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-inksoft">
                {mode === "signin" ? "sign in to your ledger" : "free, takes 20 seconds"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-lg border border-line bg-paper p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-md py-2 text-[13.5px] font-extrabold transition-all ${mode === m ? "bg-ink text-card shadow-sm" : "text-inksoft hover:text-ink"}`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {error && (
            <div className="anim-pop mt-4 rounded-lg border border-coral/40 bg-coralsoft px-3.5 py-2.5 text-[13px] font-bold text-coral" role="alert">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="anim-pop mt-4 flex items-start gap-2 rounded-lg border border-pine/40 bg-pinesoft px-3.5 py-2.5 text-[13px] font-bold text-pinedeep" role="status">
              <IconCheck size={15} className="mt-0.5 shrink-0" />
              Reset link sent to <span className="break-all font-mono">{resetSent}</span>. Check your inbox.
            </div>
          )}

          {/* Google */}
          <button
            onClick={google}
            disabled={busy !== ""}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-card py-3 text-[14.5px] font-extrabold transition hover:border-ink hover:bg-paper active:scale-[0.98] disabled:opacity-60"
          >
            {busy === "google" ? <Spinner /> : <GoogleGlyph />}
            {busy === "google" ? "Opening Google…" : "Continue with Google"}
          </button>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-inksoft">or with email</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="mt-5 space-y-4">
            {mode === "signup" && (
              <Field label="Full name" error={fieldErr.name}>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Ferreiro" autoComplete="name" />
              </Field>
            )}
            <Field label="Email" error={fieldErr.email}>
              <input
                className={inputCls}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@somewhere.tld"
                autoComplete="email"
                onKeyDown={(e) => e.key === "Enter" && (forgot ? requestReset() : submit())}
              />
            </Field>

            {!forgot && (
              <Field label="Password" error={fieldErr.pass} hint={mode === "signup" ? "min 6 characters" : undefined}>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-11`}
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-inksoft transition hover:text-ink"
                    aria-label="Toggle password visibility"
                  >
                    <IconEye size={16} off={showPass} />
                  </button>
                </div>
              </Field>
            )}

            {mode === "signin" && !forgot && (
              <div className="-mt-1 text-right">
                <button onClick={() => { setForgot(true); setError(""); setResetSent(""); }} className="text-[12.5px] font-bold text-pine underline-offset-2 transition hover:text-pinedeep hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {forgot && (
              <p className="rounded-lg bg-paper px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-inksoft">
                Enter your account email above and we'll send you a secure reset link from Firebase.
              </p>
            )}

            {mode === "signup" && !forgot && (
              <div>
                <span className="mb-1.5 block text-[12.5px] font-bold uppercase tracking-wide text-inksoft">I'm here to…</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { r: "buyer", icon: <IconUser size={18} />, t: "Buy goods", s: "Shop the floor" },
                      { r: "seller", icon: <IconStore size={18} />, t: "Sell goods", s: "Open a stall" },
                    ] as { r: Role; icon: React.ReactNode; t: string; s: string }[]
                  ).map((o) => (
                    <button
                      key={o.r}
                      type="button"
                      onClick={() => setRole(o.r)}
                      className={`rounded-xl border-2 p-3.5 text-left transition active:scale-[0.98] ${
                        role === o.r ? "border-pine bg-pinesoft" : "border-line bg-card hover:border-inksoft"
                      }`}
                    >
                      <span className={role === o.r ? "text-pinedeep" : "text-inksoft"}>{o.icon}</span>
                      <p className="mt-1.5 text-[14px] font-extrabold">{o.t}</p>
                      <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{o.s}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 font-mono text-[10.5px] leading-relaxed text-inksoft">
                  Applies to brand-new accounts (Google or email). The first member of a fresh market is handed the
                  admin keys.
                </p>
              </div>
            )}

            {mode === "signup" && role === "seller" && !forgot && (
              <div className="anim-rise rounded-xl border border-pine/30 bg-pinesoft/50 p-4">
                <p className="flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-pinedeep">
                  <IconStore size={13} /> Your stall details
                </p>
                <div className="mt-3.5 space-y-3.5">
                  <Field label="Stall name" error={fieldErr.stall}>
                    <input className={inputCls} value={stall} onChange={(e) => setStall(e.target.value)} placeholder="Nora Norte Ceramics" />
                  </Field>
                  <Field label="Phone" error={fieldErr.phone}>
                    <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 010 2299" inputMode="tel" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ships from · city" error={fieldErr.sCity}>
                      <input className={inputCls} value={sCity} onChange={(e) => setSCity(e.target.value)} placeholder="Eastport" />
                    </Field>
                    <Field label="Country" error={fieldErr.sCountry}>
                      <input className={inputCls} value={sCountry} onChange={(e) => setSCountry(e.target.value)} placeholder="USA" />
                    </Field>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-inksoft">
                        <IconTag size={12} /> Aisles you'll stock
                      </span>
                      <span className={`font-mono text-[10px] font-bold ${sCats.length ? "text-pinedeep" : "text-inksoft"}`}>{sCats.length} picked</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((c) => {
                        const on = sCats.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                            className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[11.5px] font-bold transition active:scale-95 ${
                              on ? "border-pine bg-pine text-card" : "border-line bg-card text-inksoft hover:border-inksoft"
                            }`}
                          >
                            {on && <IconCheck size={10} />} {c}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErr.sCats && <p className="mt-1.5 text-[12px] font-bold text-coral">{fieldErr.sCats}</p>}
                  </div>
                  <p className="font-mono text-[10px] leading-relaxed text-inksoft">
                    Sign up with Google instead? You'll finish payout &amp; house rules in a quick setup wizard after.
                  </p>
                </div>
              </div>
            )}

            {forgot ? (
              <div className="flex gap-2.5">
                <button
                  onClick={requestReset}
                  disabled={busy !== ""}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pine py-3 text-[15px] font-extrabold text-card transition hover:bg-pinedeep active:scale-[0.98] disabled:opacity-60"
                >
                  {busy === "reset" ? <Spinner /> : <IconArrowRight size={16} />}
                  {busy === "reset" ? "Sending…" : "Email me a reset link"}
                </button>
                <button
                  onClick={() => setForgot(false)}
                  className="rounded-lg border border-line px-4 text-[13.5px] font-bold text-inksoft transition hover:border-ink hover:text-ink"
                >
                  Back
                </button>
              </div>
            ) : (
              <button
                onClick={submit}
                disabled={busy !== ""}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-pine py-3 text-[15px] font-extrabold text-card transition hover:bg-pinedeep active:scale-[0.98] disabled:opacity-60"
              >
                {busy === "email" ? <Spinner /> : <IconArrowRight size={16} />}
                {busy === "email" ? "Checking the ledger…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 px-2 text-center font-mono text-[10.5px] leading-relaxed text-inksoft">
          Protected by Firebase Auth · Google &amp; email/password · sessions stay signed in on this device
        </p>
      </div>
    </div>
  );
}
