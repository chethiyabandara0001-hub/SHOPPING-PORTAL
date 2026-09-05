import { useMemo, useState } from "react";
import { navigate, useStore } from "../lib/store";
import { CATEGORIES, money, productRating, stallComplete, stallName, timeAgo } from "../lib/data";
import type { Order, OrderStatus, Product } from "../lib/data";
import { Confirm, EmptyState, Field, inputCls, Modal, ProductImage, Spinner, StatusPill } from "../components/ui";
import {
  IconAlert,
  IconArrowRight,
  IconBox,
  IconCheck,
  IconEdit,
  IconGauge,
  IconImage,
  IconPackage,
  IconPlus,
  IconReceipt,
  IconSpark,
  IconStar,
  IconStore,
  IconTag,
  IconTrash,
  IconTruck,
  IconX,
} from "../components/Icons";

interface FormState {
  name: string;
  category: string;
  price: string;
  compareAt: string;
  stock: string;
  desc: string;
  tags: string;
  image: string;
}

const emptyForm: FormState = { name: "", category: "Home", price: "", compareAt: "", stock: "10", desc: "", tags: "", image: "" };

export default function SellerPage() {
  const { db, user, authReady, saveProduct, deleteProduct, advanceOrder } = useStore();
  const [tab, setTab] = useState<"overview" | "listings" | "orders">("overview");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErr, setFormErr] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");

  const myProducts = useMemo(() => db.products.filter((p) => p.sellerId === user?.id), [db.products, user]);
  const myOrders = useMemo(
    () => db.orders.filter((o) => o.items.some((i) => i.sellerId === user?.id)).sort((a, b) => b.placedAt - a.placedAt),
    [db.orders, user],
  );

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
        <h1 className="font-display mt-4 text-2xl font-extrabold">The studio is for stall holders</h1>
        <p className="mt-2 text-sm text-inksoft">Sign in with a seller account — or open a free stall in 20 seconds.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => navigate("/auth")} className="rounded-lg bg-pine px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">Sign in</button>
          <button onClick={() => navigate("/auth?mode=signup")} className="rounded-lg border border-line px-5 py-2.5 text-sm font-bold transition hover:border-ink">Open a stall</button>
        </div>
      </div>
    );
  }

  if (user.role !== "seller") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-ambersoft text-[#8a5c05]"><IconAlert size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Sellers only past this curtain</h1>
        <p className="mt-2 text-sm text-inksoft">
          You're signed in as <span className="font-mono font-bold uppercase">{user.role}</span>. The Admin Desk can flip your
          role if you've got goods to move.
        </p>
        <button onClick={() => navigate(user.role === "admin" ? "/admin" : "/")} className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">
          {user.role === "admin" ? "Go to Admin Desk" : "Back to the floor"}
        </button>
      </div>
    );
  }

  /* ----- stats ----- */
  const activeOrders = myOrders.filter((o) => o.status !== "canceled");
  const gross = activeOrders.reduce((a, o) => a + o.items.filter((i) => i.sellerId === user.id).reduce((s, i) => s + i.price * i.qty, 0), 0);
  const net = gross * (1 - db.settings.commission);
  const unitsSold = myProducts.reduce((a, p) => a + p.sold, 0);
  const myRatings = myProducts.flatMap((p) => db.reviews.filter((r) => r.productId === p.id));
  const avgRating = myRatings.length ? myRatings.reduce((a, r) => a + r.rating, 0) / myRatings.length : 0;
  const lowStock = myProducts.filter((p) => p.stock > 0 && p.stock <= 5);
  const soldOut = myProducts.filter((p) => p.stock === 0);
  const pendingCount = myOrders.filter((o) => o.status === "pending").length;

  const openForm = (p?: Product) => {
    if (p) {
      setEditing(p);
      setForm({
        name: p.name, category: p.category, price: String(p.price), compareAt: p.compareAt ? String(p.compareAt) : "",
        stock: String(p.stock), desc: p.desc, tags: p.tags.join(", "), image: p.image ?? "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setFormErr({});
    setFormOpen(true);
  };

  const submitForm = () => {
    const fe: Record<string, string> = {};
    const price = parseFloat(form.price);
    const compareAt = form.compareAt ? parseFloat(form.compareAt) : null;
    const stock = parseInt(form.stock, 10);
    if (form.name.trim().length < 3) fe.name = "At least 3 characters.";
    if (!Number.isFinite(price) || price <= 0) fe.price = "Positive number.";
    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= price)) fe.compareAt = "Must exceed price.";
    if (!Number.isFinite(stock) || stock < 0) fe.stock = "0 or more.";
    if (form.desc.trim().length < 20) fe.desc = "Give buyers at least 20 characters.";
    setFormErr(fe);
    if (Object.keys(fe).length) return;
    saveProduct(
      {
        name: form.name.trim(), category: form.category, price, compareAt, stock,
        desc: form.desc.trim(), image: form.image.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5),
      },
      editing?.id,
    );
    setFormOpen(false);
  };

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { pending: "shipped", shipped: "delivered" };
  const visibleOrders = orderFilter === "all" ? myOrders : myOrders.filter((o) => o.status === orderFilter);

  const myOrderValue = (o: Order) => o.items.filter((i) => i.sellerId === user.id).reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
      {/* header */}
      <div className="anim-rise flex flex-wrap items-center gap-4">
        <div className="stripes-thin h-12 w-2 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-pine">Seller Studio</p>
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight">{stallName(user)}</h1>
          {user.seller && (
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-inksoft">
              kept by {user.name} · {user.seller.businessType === "registered" ? "registered business" : "individual"} · ships from {user.seller.city}, {user.seller.country}
            </p>
          )}
        </div>
        <button onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-3 text-[14px] font-extrabold text-ink transition hover:brightness-95 active:scale-95">
          <IconPlus size={16} /> New listing
        </button>
      </div>

      {/* stall identity — only once payout routing is configured */}
      {stallComplete(user) && user.seller ? (
        <div className="anim-rise mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display grid size-11 shrink-0 place-items-center rounded-xl bg-pine text-[16px] font-extrabold text-card">
              {user.seller.stallName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="inline-flex items-center gap-1.5 text-[14.5px] font-bold"><IconStore size={14} className="text-pine" /> {user.seller.stallName}</p>
              <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">
                {user.seller.categories.length} aisle{user.seller.categories.length === 1 ? "" : "s"}
                {user.seller.payout && <> · payouts to {user.seller.payout.method === "bank" ? "bank" : "PayPal"}</>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {user.seller.categories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-pinesoft px-2.5 py-1 text-[11.5px] font-bold text-pinedeep">
                <IconTag size={11} /> {c}
              </span>
            ))}
          </div>
          {user.seller.bio && <p className="basis-full border-l-2 border-amber pl-3 text-[12.5px] italic leading-relaxed text-inksoft">“{user.seller.bio}”</p>}
        </div>
      ) : (
        <div className="anim-rise mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber/50 bg-ambersoft px-5 py-4">
          <IconStore size={18} className="shrink-0 text-[#8a5c05]" />
          <p className="text-[13px] font-bold text-[#6b4a06]">Finish setting up your stall so buyers know who they're buying from.</p>
          <button onClick={() => navigate("/onboarding")} className="ml-auto rounded-lg bg-ink px-4 py-2 text-[12.5px] font-bold text-card transition hover:bg-pinedeep">
            Complete stall profile
          </button>
        </div>
      )}

      {/* stats */}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { icon: <IconGauge size={16} />, l: "Gross sales", v: money(gross), s: "uncanceled orders" },
          { icon: <IconStar size={16} />, l: "Net earnings", v: money(net), s: `after ${Math.round(db.settings.commission * 100)}% fee` },
          { icon: <IconReceipt size={16} />, l: "Orders", v: String(myOrders.length), s: `${pendingCount} awaiting action` },
          { icon: <IconPackage size={16} />, l: "Units sold", v: String(unitsSold), s: "lifetime" },
          { icon: <IconSpark size={16} />, l: "Rating", v: avgRating ? avgRating.toFixed(1) + "★" : "—", s: `${myRatings.length} reviews` },
        ].map((c, i) => (
          <div key={c.l} className="anim-rise rounded-xl border border-line bg-card p-4 transition hover:border-pine/40" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-inksoft">{c.icon}{c.l}</span>
            <p className="font-display tnum mt-2 text-[22px] font-extrabold leading-none">{c.v}</p>
            <p className="mt-1 text-[11px] font-semibold text-inksoft">{c.s}</p>
          </div>
        ))}
      </div>

      {/* alerts */}
      {(lowStock.length > 0 || soldOut.length > 0) && (
        <div className="anim-rise mt-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-amber/50 bg-ambersoft px-4 py-3">
          <IconAlert size={17} className="shrink-0 text-[#8a5c05]" />
          <p className="text-[13px] font-bold text-[#6b4a06]">
            {soldOut.length > 0 && `${soldOut.length} listing${soldOut.length > 1 ? "s" : ""} sold out`}
            {soldOut.length > 0 && lowStock.length > 0 && " · "}
            {lowStock.length > 0 && `${lowStock.length} running low (≤5)`}
          </p>
          <button onClick={() => setTab("listings")} className="ml-auto rounded-lg bg-ink px-3.5 py-1.5 text-[12px] font-bold text-card transition hover:bg-pinedeep">
            Restock now
          </button>
        </div>
      )}

      {/* tabs */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        {(
          [
            { v: "overview", label: "Shelf", icon: <IconBox size={14} /> },
            { v: "listings", label: `Listings · ${myProducts.length}`, icon: <IconStore size={14} /> },
            { v: "orders", label: `Orders · ${myOrders.length}`, icon: <IconReceipt size={14} /> },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13.5px] font-bold transition active:scale-95 ${
              tab === t.v ? "border-ink bg-ink text-card" : "border-line bg-card text-inksoft hover:border-ink hover:text-ink"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* overview: shelf grid */}
      {tab === "overview" && (
        <div className="anim-rise mt-6">
          {myProducts.length === 0 ? (
            <EmptyState
              icon={<IconStore size={24} />}
              title="Your shelf is empty"
              body="List your first piece — name it, price it, set the stock. It's live in under a minute."
              action={<button onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-extrabold text-ink transition hover:brightness-95"><IconPlus size={15} /> New listing</button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {myProducts.slice(0, 8).map((p) => (
                <button key={p.id} onClick={() => setTab("listings")} className="group overflow-hidden rounded-xl border border-line bg-card text-left transition hover:-translate-y-0.5 hover:border-pine/40 hover:shadow-[var(--shadow-lift)]">
                  <ProductImage product={p} className="aspect-[4/3] w-full" imgClass="transition-transform duration-500 group-hover:scale-105" />
                  <div className="p-3.5">
                    <p className="truncate text-[13.5px] font-bold">{p.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="tnum font-mono text-[13px] font-bold">{money(p.price)}</span>
                      <span className={`font-mono text-[10.5px] font-bold uppercase ${p.stock === 0 ? "text-coral" : p.stock <= 5 ? "text-[#8a5c05]" : "text-pine"}`}>
                        {p.stock === 0 ? "out" : `${p.stock} left`}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* listings table */}
      {tab === "listings" && (
        <div className="anim-rise mt-6 overflow-x-auto rounded-xl border border-line bg-card">
          {myProducts.length === 0 ? (
            <div className="p-8"><EmptyState icon={<IconBox size={24} />} title="No listings yet" body="Your goods belong on the floor." /></div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-inksoft">
                  <th className="px-4 py-3 font-bold">Listing</th>
                  <th className="px-4 py-3 font-bold">Price</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 font-bold">Sold</th>
                  <th className="px-4 py-3 font-bold">Rating</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map((p) => {
                  const r = productRating(p.id, db.reviews);
                  return (
                    <tr key={p.id} className="border-b border-line/60 transition last:border-0 hover:bg-pinesoft/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage product={p} className="size-11 shrink-0 rounded-lg" />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-bold">
                              <span className="truncate">{p.name}</span>
                              {p.featured && <IconSpark size={12} className="shrink-0 text-amber" />}
                            </p>
                            <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tnum px-4 py-3 font-mono font-bold">{money(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 font-mono text-[12px] font-bold ${
                          p.stock === 0 ? "bg-coralsoft text-coral" : p.stock <= 5 ? "bg-ambersoft text-[#8a5c05]" : "bg-pinesoft text-pinedeep"
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="tnum px-4 py-3 font-mono">{p.sold}</td>
                      <td className="px-4 py-3">
                        {r.count > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[12.5px] font-bold"><IconStar size={12} filled className="text-amber" />{r.avg.toFixed(1)}</span>
                        ) : (
                          <span className="text-inksoft/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openForm(p)} className="grid size-8 place-items-center rounded-lg border border-line transition hover:border-pine hover:text-pinedeep" aria-label={`Edit ${p.name}`}>
                            <IconEdit size={14} />
                          </button>
                          <button onClick={() => setDeleting(p)} className="grid size-8 place-items-center rounded-lg border border-line transition hover:border-coral hover:text-coral" aria-label={`Delete ${p.name}`}>
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* orders */}
      {tab === "orders" && (
        <div className="anim-rise mt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "pending", "shipped", "delivered", "canceled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-wide transition ${
                  orderFilter === f ? "border-ink bg-ink text-card" : "border-line bg-card text-inksoft hover:border-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {visibleOrders.length === 0 ? (
            <EmptyState icon={<IconTruck size={24} />} title="No orders here" body="When buyers pick up your pieces, the orders queue up in this lane." />
          ) : (
            <div className="space-y-3">
              {visibleOrders.map((o) => (
                <div key={o.id} className="rounded-xl border border-line bg-card p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div>
                      <p className="font-mono text-[14px] font-bold">{o.id}</p>
                      <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{timeAgo(o.placedAt)} · {o.buyerName}</p>
                    </div>
                    <StatusPill status={o.status} />
                    <span className="tnum ml-auto font-mono text-[15px] font-bold">{money(myOrderValue(o))}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {o.items.filter((i) => i.sellerId === user.id).map((i) => (
                      <span key={i.productId} className="inline-flex items-center gap-1.5 rounded-md bg-paper px-2.5 py-1 text-[12px] font-semibold">
                        {i.qty}× {i.name}
                      </span>
                    ))}
                    <span className="font-mono text-[11px] text-inksoft">→ {o.address.city}, {o.address.zip}</span>
                  </div>
                  {(o.status === "pending" || o.status === "shipped") && (
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      <button
                        onClick={() => advanceOrder(o.id, nextStatus[o.status]!)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2 text-[12.5px] font-bold text-card transition hover:bg-pinedeep active:scale-95"
                      >
                        {o.status === "pending" ? <><IconPackage size={13} /> Mark shipped</> : <><IconTruck size={13} /> Mark delivered</>}
                      </button>
                      {o.status === "pending" && (
                        <button
                          onClick={() => advanceOrder(o.id, "canceled")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[12.5px] font-bold text-coral transition hover:border-coral active:scale-95"
                        >
                          <IconX size={12} /> Cancel & restock
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* product form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit listing" : "New listing"} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name" error={formErr.name}>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cinder Table Lamp" />
            </Field>
          </div>
          <Field label="Aisle (category)">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price $" error={formErr.price}>
              <input className={`${inputCls} font-mono`} type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49" />
            </Field>
            <Field label="Was $" error={formErr.compareAt} hint="optional">
              <input className={`${inputCls} font-mono`} type="number" min="1" value={form.compareAt} onChange={(e) => setForm({ ...form, compareAt: e.target.value })} placeholder="—" />
            </Field>
            <Field label="Stock" error={formErr.stock}>
              <input className={`${inputCls} font-mono`} type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" error={formErr.desc} hint={`${form.desc.length} chars`}>
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Materials, dimensions, why it's good…" />
            </Field>
          </div>
          <Field label="Tags" hint="comma separated">
            <input className={inputCls} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="oak, dimmable, small-batch" />
          </Field>
          <Field label="Image URL" hint="optional — auto tile if empty">
            <input className={inputCls} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
          </Field>
          <div className="sm:col-span-2 flex items-center gap-4 rounded-lg border border-dashed border-line bg-paper p-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-card">
              {form.image.trim() ? (
                <img src={form.image} alt="preview" className="size-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              ) : (
                <IconImage size={20} className="text-inksoft" />
              )}
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-inksoft">
              Live preview. Paste any image URL — KIOSK auto-generates a monogram tile when there isn't one, so the shelf never looks broken.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setFormOpen(false)} className="rounded-lg border border-line px-5 py-2.5 text-sm font-bold transition hover:border-ink">Cancel</button>
          <button onClick={submitForm} className="inline-flex items-center gap-2 rounded-lg bg-pine px-5 py-2.5 text-sm font-extrabold text-card transition hover:bg-pinedeep active:scale-95">
            <IconCheck size={15} /> {editing ? "Save changes" : "Put it on the floor"}
          </button>
        </div>
      </Modal>

      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteProduct(deleting.id)}
        title="Pull this listing?"
        body={`“${deleting?.name}” comes off the floor immediately. It's also removed from every crate and wishlist. Order history stays intact.`}
        dangerLabel="Remove listing"
      />

      {/* quick link */}
      <div className="mt-10 flex items-center justify-between rounded-xl border border-line bg-card px-5 py-4">
        <p className="text-[13.5px] font-semibold text-inksoft">
          Want a hand? The <span className="font-bold text-ink">Admin Desk</span> can feature your best piece on the front shelf.
        </p>
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-pine transition hover:gap-3">
          View your stall on the floor <IconArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
