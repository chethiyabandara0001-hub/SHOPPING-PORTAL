import { useEffect, useMemo, useState } from "react";
import { navigate, useStore } from "../lib/store";
import type { Route } from "../lib/store";
import { fullDate, money, timeAgo } from "../lib/data";
import type { Order } from "../lib/data";
import { Avatar, EmptyState, Field, inputCls, Modal, ProductImage, Spinner, StarInput, StatusPill, STATUS_META } from "../components/ui";
import {
  IconArrowUpRight,
  IconBox,
  IconCart,
  IconHeart,
  IconReceipt,
  IconSettings,
  IconStar,
  IconStore,
  IconUser,
  IconX,
} from "../components/Icons";

type Tab = "overview" | "orders" | "wishlist" | "profile";

const FLOW = ["pending", "shipped", "delivered"] as const;

function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "canceled") {
    return (
      <p className="rounded-lg bg-coralsoft px-3 py-2 font-mono text-[11.5px] font-bold uppercase tracking-wide text-coral">
        Canceled · stock returned to shelf
      </p>
    );
  }
  const reachedIdx = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  return (
    <div className="flex items-center">
      {FLOW.map((s, i) => (
        <div key={s} className={`flex items-center ${i < FLOW.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center">
            <span
              className={`grid size-7 place-items-center rounded-full border-2 font-mono text-[10px] font-bold transition ${
                i <= reachedIdx ? "border-pine bg-pine text-card" : "border-line bg-card text-inksoft"
              }`}
            >
              {i + 1}
            </span>
            <span className={`mt-1 font-mono text-[9.5px] font-bold uppercase tracking-wide ${i <= reachedIdx ? "text-pinedeep" : "text-inksoft/60"}`}>
              {STATUS_META[s].label}
            </span>
          </div>
          {i < FLOW.length - 1 && (
            <div className={`mx-2 mb-4 h-[3px] flex-1 rounded-full ${i < reachedIdx ? "bg-pine" : "bg-line"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AccountPage({ route }: { route: Route }) {
  const { db, user, authReady, logout, updateProfile, resetPassword, toggleWish, addToCart, canReview, addReview, toast } = useStore();
  const [tab, setTab] = useState<Tab>((route.query.get("tab") as Tab) || "overview");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<{ productId: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [addr, setAddr] = useState(user?.address ?? { line1: "", city: "", zip: "", country: "USA" });

  /* the session resolves asynchronously — pour the profile into the form once it lands */
  const userId = user?.id;
  useEffect(() => {
    if (user) {
      setName(user.name);
      setAddr(user.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const orders = useMemo(() => db.orders.filter((o) => o.buyerId === user?.id).sort((a, b) => b.placedAt - a.placedAt), [db.orders, user]);
  const wished = useMemo(
    () => (user ? (db.wishlists[user.id] ?? []).flatMap((pid) => db.products.filter((p) => p.id === pid)) : []),
    [db.wishlists, db.products, user],
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
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-pinesoft text-pine"><IconUser size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">That's members-only aisle</h1>
        <p className="mt-2 text-sm text-inksoft">Sign in to see orders, wishlist and profile.</p>
        <button onClick={() => navigate("/auth?next=account")} className="mt-6 rounded-lg bg-pine px-6 py-3 text-sm font-bold text-card transition hover:bg-pinedeep">Sign in</button>
      </div>
    );
  }

  const spent = orders.filter((o) => o.status !== "canceled").reduce((a, o) => a + o.total, 0);

  const saveProfile = () => {
    if (name.trim().length < 2) { toast("Name needs at least 2 characters.", "error"); return; }
    if (addr.line1 && !/^\d{4,6}$/.test(addr.zip.trim())) { toast("ZIP should be 4–6 digits.", "error"); return; }
    updateProfile({ name: name.trim(), address: addr });
  };

  const submitReview = () => {
    if (!reviewFor) return;
    if (text.trim().length < 8) { toast("A few more words — 8 characters minimum.", "error"); return; }
    addReview(reviewFor.productId, rating, text);
    setText(""); setRating(5); setReviewFor(null);
  };

  const tabs: { v: Tab; label: string; icon: React.ReactNode }[] = [
    { v: "overview", label: "Overview", icon: <IconUser size={15} /> },
    { v: "orders", label: `Orders · ${orders.length}`, icon: <IconReceipt size={15} /> },
    { v: "wishlist", label: `Wishlist · ${wished.length}`, icon: <IconHeart size={15} /> },
    { v: "profile", label: "Profile", icon: <IconSettings size={15} /> },
  ];

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 lg:px-6">
      {/* header */}
      <div className="anim-rise flex flex-wrap items-center gap-4 rounded-xl border border-line bg-card p-5">
        <Avatar name={user.name} color={user.color} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[24px] font-extrabold tracking-tight">{user.name}</h1>
          <p className="font-mono text-[11px] uppercase tracking-wider text-inksoft">
            {user.role} · member since {fullDate(user.joined)}
          </p>
        </div>
        {user.role === "seller" && (
          <button onClick={() => navigate("/seller")} className="inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2.5 text-[13px] font-bold text-card transition hover:bg-pinedeep">
            <IconStore size={15} /> Seller Studio
          </button>
        )}
        {user.role === "admin" && (
          <button onClick={() => navigate("/admin")} className="inline-flex items-center gap-2 rounded-lg bg-plum px-4 py-2.5 text-[13px] font-bold text-card transition hover:brightness-110">
            <IconStore size={15} /> Admin Desk
          </button>
        )}
        <button onClick={() => { logout(); navigate("/"); }} className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-bold text-inksoft transition hover:border-coral hover:text-coral">
          Sign out
        </button>
      </div>

      {/* tabs */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-[13.5px] font-bold transition active:scale-95 ${
              tab === t.v ? "border-ink bg-ink text-card" : "border-line bg-card text-inksoft hover:border-ink hover:text-ink"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* overview */}
      {tab === "overview" && (
        <div className="anim-rise mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { l: "Orders placed", v: String(orders.length), s: "all time" },
              { l: "Total spent", v: money(spent), s: "on the floor" },
              { l: "Wishlist", v: String(wished.length), s: "pieces watched" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-line bg-card p-5 transition hover:border-pine/40">
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-inksoft">{c.l}</p>
                <p className="font-display tnum mt-2 text-[30px] font-extrabold leading-none text-pinedeep">{c.v}</p>
                <p className="mt-1 text-[12px] font-semibold text-inksoft">{c.s}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold">Latest order</h2>
              <button onClick={() => setTab("orders")} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-pine transition hover:gap-2">
                All orders <IconArrowUpRight size={13} />
              </button>
            </div>
            {orders[0] ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[13px] font-bold">{orders[0].id}</span>
                  <StatusPill status={orders[0].status} />
                </div>
                <div className="mt-4"><OrderTimeline order={orders[0]} /></div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-inksoft">No orders yet — the floor awaits.</p>
            )}
          </div>

          {wished.length > 0 && (
            <div className="rounded-xl border border-line bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold">On your radar</h2>
                <button onClick={() => setTab("wishlist")} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-pine transition hover:gap-2">
                  Full wishlist <IconArrowUpRight size={13} />
                </button>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {wished.slice(0, 5).map((p) => (
                  <button key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="group w-36 shrink-0 text-left">
                    <ProductImage product={p} className="aspect-square w-36 rounded-lg transition group-hover:opacity-90" />
                    <p className="mt-1.5 truncate text-[12.5px] font-bold">{p.name}</p>
                    <p className="tnum font-mono text-[12px] text-inksoft">{money(p.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* orders */}
      {tab === "orders" && (
        <div className="anim-rise mt-6 space-y-3">
          {orders.length === 0 && (
            <EmptyState
              icon={<IconBox size={24} />}
              title="No orders in the ledger"
              body="When you buy something, it lands here with a live status timeline."
              action={<button onClick={() => navigate("/")} className="rounded-lg bg-pine px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">Start shopping</button>}
            />
          )}
          {orders.map((o) => (
            <div key={o.id} className="overflow-hidden rounded-xl border border-line bg-card">
              <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition hover:bg-pinesoft/40">
                <div className="flex -space-x-2">
                  {o.items.slice(0, 3).map((i) => (
                    <ProductImage key={i.productId} product={i} className="size-10 rounded-lg border-2 border-card" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13.5px] font-bold">{o.id}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{timeAgo(o.placedAt)} · {o.items.length} listing{o.items.length > 1 ? "s" : ""}</p>
                </div>
                <span className="tnum font-mono text-[15px] font-bold">{money(o.total)}</span>
                <StatusPill status={o.status} />
              </button>
              {expanded === o.id && (
                <div className="anim-fade border-t border-line px-5 py-5">
                  <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                    <div>
                      <div className="max-w-sm"><OrderTimeline order={o} /></div>
                      <div className="mt-5 space-y-2.5">
                        {o.items.map((i) => (
                          <div key={i.productId} className="flex items-center gap-3">
                            <ProductImage product={i} className="size-12 rounded-lg" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] font-bold">{i.name}</p>
                              <p className="font-mono text-[11px] text-inksoft">qty {i.qty} · {money(i.price)}</p>
                            </div>
                            {canReview(i.productId) && (
                              <button
                                onClick={() => setReviewFor({ productId: i.productId, name: i.name })}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber px-3 py-1.5 text-[12px] font-extrabold text-ink transition hover:brightness-95 active:scale-95"
                              >
                                <IconStar size={12} filled /> Review
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-fit rounded-lg border border-line bg-paper p-4">
                      <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-inksoft">Ships to</p>
                      <p className="mt-1.5 text-[13px] font-semibold leading-relaxed">
                        {o.address.line1}<br />{o.address.city}, {o.address.zip}<br />{o.address.country}
                      </p>
                      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-wider text-inksoft">Paid with ····{o.paymentLast4}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* wishlist */}
      {tab === "wishlist" && (
        <div className="anim-rise mt-6">
          {wished.length === 0 ? (
            <EmptyState
              icon={<IconHeart size={24} />}
              title="Wishlist is empty"
              body="Tap the heart on anything you fancy and it'll wait for you here."
              action={<button onClick={() => navigate("/")} className="rounded-lg bg-pine px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">Browse the floor</button>}
            />
          ) : (
            <div className="space-y-3">
              {wished.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-line bg-card p-3.5 transition hover:border-pine/40">
                  <button onClick={() => navigate(`/product/${p.id}`)}>
                    <ProductImage product={p} className="size-16 rounded-lg" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold">{p.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-inksoft">{p.category}</p>
                    <p className={`mt-0.5 font-mono text-[11px] font-bold ${p.stock === 0 ? "text-coral" : "text-pine"}`}>
                      {p.stock === 0 ? "Sold out" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}
                    </p>
                  </div>
                  <span className="tnum font-mono text-[15px] font-bold">{money(p.price)}</span>
                  <button
                    onClick={() => addToCart(p.id)}
                    disabled={p.stock === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-bold text-card transition hover:bg-pinedeep active:scale-95 disabled:opacity-30"
                  >
                    <IconCart size={13} /> Add
                  </button>
                  <button onClick={() => toggleWish(p.id)} className="grid size-9 place-items-center rounded-lg border border-line text-coral transition hover:border-coral active:scale-90" aria-label="Remove from wishlist">
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* profile */}
      {tab === "profile" && (
        <div className="anim-rise mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-line bg-card p-6">
            <h2 className="font-display text-lg font-extrabold">Profile & address</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Email" hint="locked"><input className={`${inputCls} opacity-60`} value={user.email} disabled /></Field>
              <div className="sm:col-span-2"><Field label="Street address"><input className={inputCls} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="88 Alder Row, Apt 4" /></Field></div>
              <Field label="City"><input className={inputCls} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ZIP"><input className={inputCls} value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} /></Field>
                <Field label="Country"><input className={inputCls} value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} /></Field>
              </div>
            </div>
            <button onClick={saveProfile} className="mt-5 rounded-lg bg-pine px-6 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep active:scale-95">
              Save changes
            </button>
          </div>
          <div className="h-fit rounded-xl border border-line bg-card p-6">
            <h3 className="font-display text-[15.5px] font-extrabold">Account facts</h3>
            <dl className="mt-4 space-y-3 text-[13.5px]">
              <div className="flex justify-between"><dt className="text-inksoft">Role</dt><dd className="font-mono font-bold uppercase">{user.role}</dd></div>
              <div className="flex justify-between"><dt className="text-inksoft">Joined</dt><dd className="font-mono font-bold">{fullDate(user.joined)}</dd></div>
              <div className="flex justify-between"><dt className="text-inksoft">Standing</dt><dd className={`font-mono font-bold ${user.blocked ? "text-coral" : "text-pine"}`}>{user.blocked ? "suspended" : "good"}</dd></div>
              <div className="flex justify-between gap-3">
                <dt className="text-inksoft">Sign-in</dt>
                <dd className="text-right font-mono font-bold">{user.provider === "google" ? "Google" : "Email & password"}</dd>
              </div>
            </dl>
            {user.provider !== "google" && (
              <button
                onClick={async () => {
                  const err = await resetPassword(user.email);
                  if (err) toast(err, "error");
                  else toast(`Password reset link sent to ${user.email}.`, "info");
                }}
                className="mt-4 w-full rounded-lg border border-line py-2.5 text-[12.5px] font-bold text-inksoft transition hover:border-pine hover:text-pinedeep active:scale-[0.98]"
              >
                Email me a password reset link
              </button>
            )}
            <div className="mt-4 rounded-lg bg-paper p-3.5 font-mono text-[11px] leading-relaxed text-inksoft">
              Tip: sellers get a full studio with stock and order tools — ask the admin desk for a role change.
            </div>
          </div>
        </div>
      )}

      {/* review modal */}
      <Modal open={!!reviewFor} onClose={() => setReviewFor(null)} title={`Review · ${reviewFor?.name ?? ""}`}>
        <div className="space-y-4">
          <Field label="Rating">
            <StarInput value={rating} onChange={setRating} />
          </Field>
          <Field label="Your take" hint={`${text.length}/400`}>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 400))} rows={4} className={`${inputCls} resize-none`} placeholder="How's it holding up?" />
          </Field>
          <button onClick={submitReview} className="w-full rounded-lg bg-amber py-3 text-sm font-extrabold text-ink transition hover:brightness-95 active:scale-[0.98]">
            Post review
          </button>
        </div>
      </Modal>
    </div>
  );
}
