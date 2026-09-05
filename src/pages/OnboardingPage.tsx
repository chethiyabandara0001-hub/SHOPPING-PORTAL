import { useEffect, useMemo, useRef, useState } from "react";
import { navigate, useStore } from "../lib/store";
import { CATEGORIES, money, stallComplete } from "../lib/data";
import type { SellerProfile } from "../lib/data";
import { Field, inputCls, Spinner } from "../components/ui";
import {
  IconArrowRight,
  IconBox,
  IconCheck,
  IconChevronRight,
  IconGauge,
  IconReceipt,
  IconSpark,
  IconStore,
  IconTag,
  IconUser,
  Logo,
} from "../components/Icons";

const STEPS = [
  {
    n: "01",
    t: "The stall",
    d: "Name your corner of the floor, tell us where you ship from and what you'll stock.",
  },
  {
    n: "02",
    t: "The keeper",
    d: "How buyers and the market reach the person behind the counter.",
  },
  {
    n: "03",
    t: "Payouts & house rules",
    d: "Where your earnings land and the terms every stall sells under.",
  },
];

type Payout = { method: "bank" | "paypal"; detail: string };

export default function OnboardingPage() {
  const { user, authReady, db, openStall, toast } = useStore();

  /* resume from a partial profile (e.g. details captured at sign-up) */
  const prior = user?.seller ?? null;
  const [step, setStep] = useState(() => (prior?.stallName ? 2 : 0));
  const [stallNameV, setStallNameV] = useState(prior?.stallName ?? "");
  const [businessType, setBusinessType] = useState<"individual" | "registered">(prior?.businessType ?? "individual");
  const [city, setCity] = useState(prior?.city ?? user?.address.city ?? "");
  const [country, setCountry] = useState(prior?.country ?? user?.address.country ?? "USA");
  const [categories, setCategories] = useState<string[]>(prior?.categories ?? []);
  const [phone, setPhone] = useState(prior?.phone ?? "");
  const [website, setWebsite] = useState(prior?.website ?? "");
  const [bio, setBio] = useState(prior?.bio ?? "");
  const [payout, setPayout] = useState<Payout>(prior?.payout ?? { method: "bank", detail: "" });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeCommission, setAgreeCommission] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<SellerProfile | null>(null);
  const firedConfetti = useRef(false);

  const commission = db.settings.commission;
  const commissionPct = Math.round(commission * 100);

  /* route guards — only a *complete* stall (payout configured) is sent to the studio */
  useEffect(() => {
    if (!authReady) return;
    if (user && user.role === "seller" && stallComplete(user)) navigate("/seller");
    if (user && user.role === "admin") navigate("/admin");
  }, [authReady, user]);

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (stallNameV.trim().length < 2) e.stallName = "Give your stall a name (2+ characters).";
      if (!city.trim()) e.city = "Where does your stock ship from?";
      if (!country.trim()) e.country = "Country is required.";
      if (categories.length === 0) e.categories = "Pick at least one aisle you'll stock.";
    }
    if (s === 1) {
      if (phone.replace(/\D/g, "").length < 7) e.phone = "A reachable phone number (7+ digits).";
      if (website.trim() && !/^(@[\w.-]{2,}|https?:\/\/\S+|[\w-]+\.[a-z]{2,}\/?\S*)$/i.test(website.trim()))
        e.website = "Use a URL or an @handle.";
    }
    if (s === 2) {
      if (!payout.detail.trim()) e.payout = payout.method === "bank" ? "Account or IBAN to pay into." : "PayPal email for payouts.";
      if (!agreeTerms) e.terms = "You'll need to accept the seller terms.";
      if (!agreeCommission) e.commission = "Acknowledge the house commission to continue.";
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((v) => Math.min(v + 1, STEPS.length - 1));
  };
  const back = () => setStep((v) => Math.max(v - 1, 0));

  const build = (): SellerProfile => ({
    stallName: stallNameV.trim(),
    businessType,
    phone: phone.trim(),
    city: city.trim(),
    country: country.trim(),
    categories,
    bio: bio.trim(),
    website: website.trim() || undefined,
    payout: { method: payout.method, detail: payout.detail.trim() },
    createdAt: Date.now(),
  });

  const submit = async () => {
    if (!validate(2) || busy) return;
    setBusy(true);
    const profile = build();
    const res = await openStall(profile);
    setBusy(false);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }
    setDone(profile);
  };

  /* celebrate once the success screen lands */
  useEffect(() => {
    if (done && !firedConfetti.current) {
      firedConfetti.current = true;
      import("canvas-confetti")
        .then(({ default: confetti }) => {
          const burst = (particleRatio: number, opts: Record<string, unknown>) =>
            confetti({ ...opts, origin: { y: 0.6 }, particleCount: Math.floor(200 * particleRatio) });
          burst(0.25, { spread: 26, startVelocity: 55 });
          burst(0.2, { spread: 60 });
          burst(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          burst(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        })
        .catch(() => {});
    }
  }, [done]);

  const toggleCat = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  if (!authReady) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-4">
        <div className="flex flex-col items-center gap-3 text-inksoft">
          <Spinner className="size-6" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Checking the ledger…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-pinesoft text-pine"><IconStore size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Open a stall — with an account</h1>
        <p className="mt-2 text-sm text-inksoft">Sign in (or join free) and we'll walk you through opening your stall in about a minute.</p>
        <button onClick={() => navigate("/auth?mode=signup&role=seller&next=onboarding")} className="mt-6 rounded-lg bg-pine px-6 py-3 text-sm font-bold text-card transition hover:bg-pinedeep">
          Sign in to continue
        </button>
      </div>
    );
  }

  /* success screen */
  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="anim-pop overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--shadow-pop)]">
          <div className="stripes-awning h-[6px]" />
          <div className="p-8 text-center sm:p-10">
            <div className="anim-ring mx-auto grid size-20 place-items-center rounded-full bg-pine text-card">
              <IconStore size={34} />
            </div>
            <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-pine">Stall opened</p>
            <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-tight">
              “{done.stallName}” is on the floor.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-inksoft">
              Your seller studio is unlocked — add your first listing, set stock and watch orders roll in. Payouts head to
              your {done.payout?.method === "bank" ? "bank account" : "PayPal"} every Friday.
            </p>
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-line bg-paper p-4 text-left">
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-inksoft">Shipping from</span>
                <span className="font-mono font-bold">{done.city}, {done.country}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[13.5px]">
                <span className="text-inksoft">Aisles</span>
                <span className="font-mono font-bold">{done.categories.length} stocked</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[13.5px]">
                <span className="text-inksoft">House commission</span>
                <span className="font-mono font-bold text-pinedeep">{commissionPct}%</span>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate("/seller")} className="inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-3 text-sm font-extrabold text-card transition hover:bg-pinedeep active:scale-95">
                Enter the studio <IconArrowRight size={15} />
              </button>
              <button onClick={() => navigate("/")} className="rounded-lg border border-line px-5 py-3 text-sm font-bold transition hover:border-ink">
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 lg:px-6">
      {/* header */}
      <div className="anim-rise flex items-center gap-4">
        <Logo size={40} />
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-pine">Seller onboarding</p>
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight">Open a stall on the floor</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* stepper rail */}
        <aside className="anim-rise h-fit lg:sticky lg:top-[110px]">
          <div className="space-y-1.5">
            {STEPS.map((s, i) => {
              const active = i === step;
              const complete = i < step;
              return (
                <div
                  key={s.n}
                  className={`flex gap-3.5 rounded-xl border p-3.5 transition-all ${
                    active ? "border-pine bg-pinesoft/70 shadow-sm" : complete ? "border-line bg-card opacity-90" : "border-line bg-card opacity-55"
                  }`}
                >
                  <span
                    className={`font-display grid size-9 shrink-0 place-items-center rounded-lg text-[15px] font-extrabold transition ${
                      active ? "bg-pine text-card" : complete ? "bg-pinedeep/15 text-pinedeep" : "bg-paper text-inksoft"
                    }`}
                  >
                    {complete ? <IconCheck size={16} /> : s.n}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-display text-[15px] font-extrabold ${active ? "text-pinedeep" : ""}`}>{s.t}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-inksoft">{s.d}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 hidden rounded-xl border border-amber/40 bg-ambersoft/60 p-4 lg:block">
            <p className="flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8a5c05]">
              <IconSpark size={14} /> Why sell on KIOSK
            </p>
            <ul className="mt-2.5 space-y-2 text-[12.5px] font-semibold leading-snug text-[#6d4a04]">
              <li>· A full studio — listings, live stock & order flow</li>
              <li>· Flat {commissionPct}% commission, payouts every Friday</li>
              <li>· Free shipping banner across the whole floor</li>
            </ul>
          </div>
        </aside>

        {/* form card */}
        <div className="anim-rise" style={{ animationDelay: "70ms" }}>
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--shadow-lift)]">
            <div className="stripes-awning h-[5px]" />
            {/* progress */}
            <div className="h-1.5 bg-paper">
              <div
                className="h-full rounded-r-full bg-amber transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="p-6 sm:p-8" key={step}>
              <div className="anim-rise">
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-inksoft">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="font-display mt-1 text-[22px] font-extrabold tracking-tight">{STEPS[step].t}</h2>

                {/* STEP 1 — the stall */}
                {step === 0 && (
                  <div className="anim-rise mt-6 space-y-5">
                    <Field label="Stall name" error={errs.stallName} hint="This is how buyers see you across the floor.">
                      <input className={inputCls} value={stallNameV} onChange={(e) => setStallNameV(e.target.value)} placeholder="Nora Norte Ceramics" />
                    </Field>

                    <div>
                      <span className="mb-1.5 block text-[12.5px] font-bold uppercase tracking-wide text-inksoft">I'm selling as…</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            { v: "individual", icon: <IconUser size={17} />, t: "An individual", s: "Just me, my goods" },
                            { v: "registered", icon: <IconStore size={17} />, t: "A registered business", s: "LLC / company" },
                          ] as { v: "individual" | "registered"; icon: React.ReactNode; t: string; s: string }[]
                        ).map((o) => (
                          <button
                            key={o.v}
                            type="button"
                            onClick={() => setBusinessType(o.v)}
                            className={`rounded-xl border-2 p-3.5 text-left transition active:scale-[0.98] ${
                              businessType === o.v ? "border-pine bg-pinesoft" : "border-line bg-card hover:border-inksoft"
                            }`}
                          >
                            <span className={businessType === o.v ? "text-pinedeep" : "text-inksoft"}>{o.icon}</span>
                            <p className="mt-1.5 text-[14px] font-extrabold">{o.t}</p>
                            <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{o.s}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Ships from · city" error={errs.city}>
                        <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Eastport" />
                      </Field>
                      <Field label="Country" error={errs.country}>
                        <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="USA" />
                      </Field>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-[12.5px] font-bold uppercase tracking-wide text-inksoft">Aisles you'll stock</span>
                        <span className={`font-mono text-[10.5px] font-bold ${categories.length ? "text-pinedeep" : "text-inksoft"}`}>
                          {categories.length} selected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => {
                          const on = categories.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleCat(c)}
                              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold transition active:scale-95 ${
                                on ? "border-pine bg-pine text-card" : "border-line bg-card text-inksoft hover:border-inksoft hover:text-ink"
                              }`}
                            >
                              {on && <IconCheck size={12} />} {c}
                            </button>
                          );
                        })}
                      </div>
                      {errs.categories && <p className="mt-1.5 text-[12px] font-bold text-coral">{errs.categories}</p>}
                    </div>
                  </div>
                )}

                {/* STEP 2 — the keeper */}
                {step === 1 && (
                  <div className="anim-rise mt-6 space-y-5">
                    <Field label="Phone" error={errs.phone} hint="For order alerts and buyer questions.">
                      <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 010 2299" inputMode="tel" />
                    </Field>
                    <Field label="Website or social (optional)" error={errs.website}>
                      <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="@noranorte or noranorte.shop" />
                    </Field>
                    <Field label="Stall bio (optional)" hint={`${bio.length}/220`}>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 220))}
                        rows={4}
                        className={`${inputCls} resize-none`}
                        placeholder="Hand-thrown stoneware from a two-person studio. Small batches, honest glazes."
                      />
                    </Field>
                  </div>
                )}

                {/* STEP 3 — payouts & house rules */}
                {step === 2 && (
                  <div className="anim-rise mt-6 space-y-5">
                    <div>
                      <span className="mb-1.5 block text-[12.5px] font-bold uppercase tracking-wide text-inksoft">Payout method</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            { v: "bank", icon: <IconGauge size={17} />, t: "Bank transfer", s: "Weekly · Fridays" },
                            { v: "paypal", icon: <IconReceipt size={17} />, t: "PayPal", s: "Weekly · Fridays" },
                          ] as { v: "bank" | "paypal"; icon: React.ReactNode; t: string; s: string }[]
                        ).map((o) => (
                          <button
                            key={o.v}
                            type="button"
                            onClick={() => setPayout((p) => ({ ...p, method: o.v }))}
                            className={`rounded-xl border-2 p-3.5 text-left transition active:scale-[0.98] ${
                              payout.method === o.v ? "border-pine bg-pinesoft" : "border-line bg-card hover:border-inksoft"
                            }`}
                          >
                            <span className={payout.method === o.v ? "text-pinedeep" : "text-inksoft"}>{o.icon}</span>
                            <p className="mt-1.5 text-[14px] font-extrabold">{o.t}</p>
                            <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{o.s}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Field
                      label={payout.method === "bank" ? "Account / IBAN" : "PayPal email"}
                      error={errs.payout}
                      hint="Kept private — only the payout system reads it."
                    >
                      <input className={inputCls} value={payout.detail} onChange={(e) => setPayout((p) => ({ ...p, detail: e.target.value }))} placeholder={payout.method === "bank" ? "US29 0210 0002 1123 4567 89" : "you@paypal.com"} />
                    </Field>

                    <div className="rounded-xl border border-line bg-paper p-4">
                      <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-inksoft">The house rules</p>
                      <div className="mt-3 space-y-2.5 text-[13px] font-semibold text-inksoft">
                        <p className="flex items-center gap-2.5"><IconTag size={15} className="shrink-0 text-pine" /> KIOSK keeps a flat {commissionPct}% commission — on a {money(100)} sale you keep {money(100 - commissionPct)}.</p>
                        <p className="flex items-center gap-2.5"><IconBox size={15} className="shrink-0 text-pine" /> Returns within 30 days, no interrogation. You restock, the buyer refunds.</p>
                        <p className="flex items-center gap-2.5"><IconReceipt size={15} className="shrink-0 text-pine" /> Payouts go out every Friday to the method you chose above.</p>
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-3.5 transition hover:border-inksoft">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 size-4 accent-[#0E5A47]" />
                      <span className="text-[13px] font-semibold leading-snug">
                        I agree to the KIOSK seller terms and agree to sell only goods I'm allowed to sell.
                        {errs.terms && <span className="block text-[12px] font-bold text-coral">{errs.terms}</span>}
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-3.5 transition hover:border-inksoft">
                      <input type="checkbox" checked={agreeCommission} onChange={(e) => setAgreeCommission(e.target.checked)} className="mt-0.5 size-4 accent-[#0E5A47]" />
                      <span className="text-[13px] font-semibold leading-snug">
                        I understand the {commissionPct}% house commission and the Friday payout schedule.
                        {errs.commission && <span className="block text-[12px] font-bold text-coral">{errs.commission}</span>}
                      </span>
                    </label>
                  </div>
                )}

                {/* nav */}
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
                  <button
                    onClick={back}
                    disabled={step === 0 || busy}
                    className="rounded-lg border border-line px-4 py-2.5 text-[13.5px] font-bold text-inksoft transition hover:border-ink hover:text-ink disabled:opacity-35"
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-2">
                    {step === 0 && stallNameV.trim() && (
                      <span className="hidden font-mono text-[11px] font-bold uppercase tracking-wide text-pinedeep sm:inline">
                        opening “{stallNameV.trim()}”
                      </span>
                    )}
                    {step < STEPS.length - 1 ? (
                      <button onClick={next} className="inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-2.5 text-[13.5px] font-extrabold text-card transition hover:bg-pinedeep active:scale-[0.98]">
                        Continue <IconChevronRight size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={submit}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-2.5 text-[13.5px] font-extrabold text-ink transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
                      >
                        {busy ? <Spinner /> : <IconStore size={16} />}
                        {busy ? "Opening…" : "Open my stall"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* live stall preview */}
          <div className="anim-rise mt-5 rounded-xl border border-dashed border-line bg-card/70 p-4" style={{ animationDelay: "120ms" }}>
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-inksoft">Live preview · how buyers see you</p>
            <div className="mt-3 flex items-center gap-3.5">
              <span className="font-display grid size-12 shrink-0 place-items-center rounded-xl bg-pine text-lg font-extrabold text-card">
                {(stallNameV.trim() || user.name).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[14.5px] font-bold">
                  <IconStore size={14} className="text-pine" /> {stallNameV.trim() || "Your stall name"}
                </p>
                <p className="truncate font-mono text-[11px] uppercase tracking-wide text-inksoft">
                  {city.trim() || "Your city"}, {country.trim() || "USA"} · {categories.length ? `${categories.length} aisle${categories.length > 1 ? "s" : ""}` : "pick your aisles"}
                </p>
              </div>
            </div>
            {bio.trim() && <p className="mt-2.5 border-l-2 border-amber pl-3 text-[12.5px] italic leading-relaxed text-inksoft">“{bio.trim()}”</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
