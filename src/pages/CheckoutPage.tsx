import { useEffect, useMemo, useRef, useState } from "react";
import { navigate, useStore } from "../lib/store";
import type { Order } from "../lib/data";
import { money } from "../lib/data";
import { Field, inputCls, ProductImage, Spinner } from "../components/ui";
import { IconArrowRight, IconCard, IconCart, IconCheck, IconReceipt } from "../components/Icons";

export default function CheckoutPage() {
  const { db, user, authReady, cart, placeOrder, toast } = useStore();
  const [form, setForm] = useState({
    line1: user?.address.line1 ?? "",
    city: user?.address.city ?? "",
    zip: user?.address.zip ?? "",
    country: user?.address.country ?? "USA",
    cardName: user?.name ?? "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const synced = useRef(false);

  /* the session resolves asynchronously — prefill the saved address once it lands */
  useEffect(() => {
    if (user && !synced.current) {
      synced.current = true;
      setForm((f) => ({
        ...f,
        line1: f.line1 || user.address.line1,
        city: f.city || user.address.city,
        zip: f.zip || user.address.zip,
        country: f.country || user.address.country,
        cardName: f.cardName || user.name,
      }));
    }
  }, [user]);

  const lines = useMemo(
    () =>
      cart.flatMap((l) => {
        const p = db.products.find((x) => x.id === l.productId);
        return p ? [{ ...l, product: p }] : [];
      }),
    [cart, db.products],
  );
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const fee = +(subtotal * db.settings.commission).toFixed(2);

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
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-pinesoft text-pine"><IconReceipt size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Register before the register</h1>
        <p className="mt-2 text-sm text-inksoft">Sign in to check out — your crate will be waiting exactly as you left it.</p>
        <button onClick={() => navigate("/auth?next=checkout")} className="mt-6 rounded-lg bg-pine px-6 py-3 text-sm font-bold text-card transition hover:bg-pinedeep">
          Sign in to continue
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="anim-pop rounded-xl border border-line bg-card p-8 text-center shadow-[var(--shadow-pop)]">
          <div className="anim-ring mx-auto grid size-20 place-items-center rounded-full bg-pine text-card">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path className="anim-check" d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1 className="font-display mt-5 text-[28px] font-extrabold tracking-tight">Order placed.</h1>
          <p className="mt-2 text-sm text-inksoft">
            <span className="font-mono font-bold text-ink">{done.id}</span> is on the floor ledger. The stalls have been
            notified and your stock is already wrapped in paper.
          </p>
          <div className="mt-6 rounded-lg border border-line bg-paper p-4 text-left">
            {done.items.map((i) => (
              <div key={i.productId} className="flex items-center justify-between py-1 text-[13.5px]">
                <span className="font-semibold">{i.qty}× {i.name}</span>
                <span className="tnum font-mono font-bold">{money(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[15px] font-extrabold">
              <span>Total paid</span>
              <span className="tnum font-mono">{money(done.total)}</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => navigate("/account?tab=orders")} className="rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">
              Track it in your account
            </button>
            <button onClick={() => navigate("/")} className="rounded-lg border border-line px-5 py-2.5 text-sm font-bold transition hover:border-ink">
              Keep shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-ambersoft text-[#8a5c05]"><IconCart size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Nothing to check out</h1>
        <p className="mt-2 text-sm text-inksoft">Your crate is empty. The floor, however, is full.</p>
        <button onClick={() => navigate("/")} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-3 text-sm font-bold text-card transition hover:bg-pinedeep">
          Walk the floor <IconArrowRight size={15} />
        </button>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "cardNumber") v = v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
    if (k === "expiry") {
      v = v.replace(/\D/g, "").slice(0, 4);
      if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    if (k === "cvc") v = v.replace(/\D/g, "").slice(0, 4);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const er: Record<string, string> = {};
    if (form.line1.trim().length < 4) er.line1 = "Street address required.";
    if (!form.city.trim()) er.city = "City required.";
    if (!/^\d{4,6}$/.test(form.zip.trim())) er.zip = "4–6 digit postal code.";
    if (form.cardName.trim().length < 3) er.cardName = "Name as printed on card.";
    if (form.cardNumber.replace(/\s/g, "").length !== 16) er.cardNumber = "16-digit card number.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) er.expiry = "MM/YY";
    if (form.cvc.length < 3) er.cvc = "3–4 digits.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast("A few fields need attention before we take your money.", "error");
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder(
        { line1: form.line1.trim(), city: form.city.trim(), zip: form.zip.trim(), country: form.country.trim() },
        form.cardNumber.replace(/\s/g, "").slice(-4),
      );
      setDone(order);
      toast(`Order ${order.id} confirmed. Nice haul.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Payment failed. Try again.", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 lg:px-6">
      <h1 className="font-display anim-rise text-[30px] font-extrabold tracking-tight">Checkout</h1>
      <p className="mt-1 font-mono text-[11.5px] font-bold uppercase tracking-wider text-inksoft">Simulated gateway — your card is never charged</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="anim-rise rounded-xl border border-line bg-card p-6">
            <h2 className="font-display flex items-center gap-2.5 text-lg font-extrabold">
              <span className="grid size-7 place-items-center rounded-md bg-pine font-mono text-[13px] text-card">1</span>
              Delivery address
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street address" error={errors.line1}>
                  <input className={inputCls} value={form.line1} onChange={set("line1")} placeholder="88 Alder Row, Apt 4" />
                </Field>
              </div>
              <Field label="City" error={errors.city}>
                <input className={inputCls} value={form.city} onChange={set("city")} placeholder="Portside" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ZIP" error={errors.zip}>
                  <input className={inputCls} value={form.zip} onChange={set("zip")} placeholder="02118" inputMode="numeric" />
                </Field>
                <Field label="Country">
                  <input className={inputCls} value={form.country} onChange={set("country")} />
                </Field>
              </div>
            </div>
          </section>

          <section className="anim-rise rounded-xl border border-line bg-card p-6" style={{ animationDelay: "70ms" }}>
            <h2 className="font-display flex items-center gap-2.5 text-lg font-extrabold">
              <span className="grid size-7 place-items-center rounded-md bg-pine font-mono text-[13px] text-card">2</span>
              Payment <IconCard size={17} className="ml-auto text-inksoft" />
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Name on card" error={errors.cardName}>
                  <input className={inputCls} value={form.cardName} onChange={set("cardName")} placeholder="BEA BUYER" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Card number" error={errors.cardNumber} hint="any 16 digits">
                  <input className={`${inputCls} font-mono`} value={form.cardNumber} onChange={set("cardNumber")} placeholder="4242 4242 4242 4242" inputMode="numeric" />
                </Field>
              </div>
              <Field label="Expiry" error={errors.expiry}>
                <input className={`${inputCls} font-mono`} value={form.expiry} onChange={set("expiry")} placeholder="08/27" inputMode="numeric" />
              </Field>
              <Field label="CVC" error={errors.cvc}>
                <input className={`${inputCls} font-mono`} value={form.cvc} onChange={set("cvc")} placeholder="123" inputMode="numeric" />
              </Field>
            </div>
          </section>
        </div>

        {/* summary */}
        <aside className="anim-rise h-fit rounded-xl border border-line bg-card p-6 lg:sticky lg:top-[110px]" style={{ animationDelay: "120ms" }}>
          <h2 className="font-display text-lg font-extrabold">Your crate</h2>
          <div className="mt-4 space-y-3">
            {lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-3">
                <ProductImage product={l.product} className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{l.product.name}</p>
                  <p className="font-mono text-[11px] text-inksoft">qty {l.qty}</p>
                </div>
                <span className="tnum font-mono text-[13px] font-bold">{money(l.product.price * l.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-[13.5px]">
            <div className="flex justify-between text-inksoft"><span>Subtotal</span><span className="tnum font-mono font-semibold">{money(subtotal)}</span></div>
            <div className="flex justify-between text-inksoft"><span>Shipping</span><span className="font-mono font-semibold text-pine">Free</span></div>
            <div className="flex justify-between text-inksoft">
              <span>Market fee <em className="not-italic opacity-70">(paid by stalls)</em></span>
              <span className="tnum font-mono font-semibold">{money(fee)}</span>
            </div>
            <div className="flex justify-between pt-2 text-[17px] font-extrabold">
              <span>Total</span><span className="tnum font-mono">{money(subtotal)}</span>
            </div>
          </div>
          <button
            onClick={submit}
            disabled={placing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-amber py-3.5 text-[15px] font-extrabold text-ink transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
          >
            {placing ? (<><Spinner /> Processing…</>) : (<><IconCheck size={17} /> Place order · {money(subtotal)}</>)}
          </button>
          <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-wide text-inksoft">Simulated payment · card never charged</p>
        </aside>
      </div>
    </div>
  );
}
