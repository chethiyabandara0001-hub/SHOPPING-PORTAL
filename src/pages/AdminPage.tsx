import { useMemo, useState } from "react";
import { navigate, useStore } from "../lib/store";
import { fullDate, money } from "../lib/data";
import type { OrderStatus, Role } from "../lib/data";
import { Avatar, Confirm, Field, inputCls, ProductImage, Spinner, StatusPill } from "../components/ui";
import {
  IconBox,
  IconGauge,
  IconMegaphone,
  IconReceipt,
  IconSettings,
  IconShield,
  IconSpark,
  IconTrash,
  IconUsers,
} from "../components/Icons";

type Tab = "overview" | "users" | "products" | "orders" | "settings";

export default function AdminPage() {
  const { db, user, authReady, setUserRole, toggleBlocked, toggleFeatured, deleteProduct, advanceOrder, updateSettings } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [commission, setCommission] = useState(Math.round(db.settings.commission * 100));
  const [announcement, setAnnouncement] = useState(db.settings.announcement);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");

  const gmv = useMemo(
    () => db.orders.filter((o) => o.status !== "canceled").reduce((a, o) => a + o.total, 0),
    [db.orders],
  );
  const fees = useMemo(
    () => db.orders.filter((o) => o.status !== "canceled").reduce((a, o) => a + o.fee, 0),
    [db.orders],
  );
  const lowStockCount = db.products.filter((p) => p.stock <= 5).length;

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
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-plum/15 text-plum"><IconShield size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Keys required</h1>
        <p className="mt-2 text-sm text-inksoft">The Admin Desk needs a signed-in admin account.</p>
        <button onClick={() => navigate("/auth")} className="mt-6 rounded-lg bg-plum px-6 py-3 text-sm font-bold text-card transition hover:brightness-110">Sign in</button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-xl bg-coralsoft text-coral"><IconShield size={24} /></div>
        <h1 className="font-display mt-4 text-2xl font-extrabold">Admins only past this rope</h1>
        <p className="mt-2 text-sm text-inksoft">
          You're signed in as <span className="font-mono font-bold uppercase">{user.role}</span>. A market admin can
          promote your account from the Admin Desk — the first member of a fresh market holds the keys.
        </p>
        <button onClick={() => navigate("/")} className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">Back to the floor</button>
      </div>
    );
  }

  const deleting = db.products.find((p) => p.id === deletingId) ?? null;
  const shownUsers = roleFilter === "all" ? db.users : db.users.filter((u) => u.role === roleFilter);

  const saveSettings = () => {
    updateSettings({ commission: commission / 100, announcement: announcement.trim() });
  };

  const statusOptions: OrderStatus[] = ["pending", "shipped", "delivered", "canceled"];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
      <div className="anim-rise flex flex-wrap items-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-plum text-card"><IconShield size={22} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-plum">Admin Desk</p>
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight">Running the floor</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-inksoft">
          <span className="anim-blink size-1.5 rounded-full bg-pine" /> live ledger
        </span>
      </div>

      {/* stats */}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: <IconGauge size={16} />, l: "Gross volume", v: money(gmv), s: "uncanceled orders" },
          { icon: <IconReceipt size={16} />, l: "Market fees", v: money(fees), s: `${Math.round(db.settings.commission * 100)}% take rate` },
          { icon: <IconUsers size={16} />, l: "Members", v: String(db.users.length), s: `${db.users.filter((u) => u.role === "seller").length} sellers` },
          { icon: <IconBox size={16} />, l: "Live listings", v: String(db.products.length), s: `${lowStockCount} low on stock` },
        ].map((c, i) => (
          <div key={c.l} className="anim-rise rounded-xl border border-line bg-card p-4 transition hover:border-plum/40" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-inksoft">{c.icon}{c.l}</span>
            <p className="font-display tnum mt-2 text-[24px] font-extrabold leading-none">{c.v}</p>
            <p className="mt-1 text-[11px] font-semibold text-inksoft">{c.s}</p>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto">
        {(
          [
            { v: "overview", label: "Overview", icon: <IconGauge size={14} /> },
            { v: "users", label: `Users · ${db.users.length}`, icon: <IconUsers size={14} /> },
            { v: "products", label: `Listings · ${db.products.length}`, icon: <IconBox size={14} /> },
            { v: "orders", label: `Orders · ${db.orders.length}`, icon: <IconReceipt size={14} /> },
            { v: "settings", label: "Settings", icon: <IconSettings size={14} /> },
          ] as { v: Tab; label: string; icon: React.ReactNode }[]
        ).map((t) => (
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

      {tab === "overview" && (
        <div className="anim-rise mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-extrabold">Orders by status</h2>
            <div className="mt-4 space-y-3">
              {statusOptions.map((s) => {
                const n = db.orders.filter((o) => o.status === s).length;
                const pct = db.orders.length ? (n / db.orders.length) * 100 : 0;
                const color = s === "pending" ? "bg-amber" : s === "shipped" ? "bg-pine" : s === "delivered" ? "bg-pinedeep" : "bg-coral";
                return (
                  <div key={s}>
                    <div className="flex justify-between font-mono text-[11.5px] font-bold uppercase tracking-wide">
                      <span>{s}</span><span className="text-inksoft">{n}</span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line">
                      <div className={`anim-bar h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-extrabold">Top movers</h2>
            <div className="mt-4 space-y-2.5">
              {[...db.products].sort((a, b) => b.sold - a.sold).slice(0, 5).map((p, i) => (
                <button key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-pinesoft/50">
                  <span className="font-display w-5 text-[15px] font-extrabold text-inksoft/60">{i + 1}</span>
                  <ProductImage product={p} className="size-10 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold">{p.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="anim-bar h-full rounded-full bg-amber" style={{ width: `${(p.sold / db.products.reduce((m, x) => Math.max(m, x.sold), 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="tnum font-mono text-[12.5px] font-bold">{p.sold} sold</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="anim-rise mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(["all", "buyer", "seller", "admin"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-wide transition ${
                  roleFilter === f ? "border-ink bg-ink text-card" : "border-line bg-card text-inksoft hover:border-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-inksoft">
                  <th className="px-4 py-3 font-bold">Member</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Standing</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shownUsers.map((u) => (
                  <tr key={u.id} className="border-b border-line/60 transition last:border-0 hover:bg-pinesoft/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.color} size={34} />
                        <div className="min-w-0">
                          <p className="font-bold">{u.name}{u.id === user.id && <span className="ml-1.5 font-mono text-[10px] uppercase text-inksoft">(you)</span>}</p>
                          <p className="truncate font-mono text-[11px] text-inksoft">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]">{fullDate(u.joined)}</td>
                    <td className="px-4 py-3">
                      {u.legacy ? (
                        <span className="rounded-md bg-paper px-2 py-1.5 font-mono text-[12px] font-bold uppercase text-inksoft">
                          {u.role} · stall record
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={u.id === user.id}
                          onChange={(e) => setUserRole(u.id, e.target.value as Role)}
                          className="rounded-md border border-line bg-card px-2 py-1.5 font-mono text-[12px] font-bold uppercase outline-none disabled:opacity-50"
                        >
                          <option value="buyer">buyer</option>
                          <option value="seller">seller</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.legacy ? (
                        <span className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">no sign-in</span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase ${u.blocked ? "bg-coralsoft text-coral" : "bg-pinesoft text-pinedeep"}`}>
                          {u.blocked ? "suspended" : "good"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!u.legacy && (
                        <button
                          onClick={() => toggleBlocked(u.id)}
                          disabled={u.id === user.id}
                          className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition active:scale-95 disabled:opacity-40 ${
                            u.blocked ? "border-pine text-pinedeep hover:bg-pinesoft" : "border-line text-coral hover:border-coral"
                          }`}
                        >
                          {u.blocked ? "Reinstate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="anim-rise mt-6 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-inksoft">
                <th className="px-4 py-3 font-bold">Listing</th>
                <th className="px-4 py-3 font-bold">Seller</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">Front shelf</th>
                <th className="px-4 py-3 text-right font-bold">Pull</th>
              </tr>
            </thead>
            <tbody>
              {db.products.map((p) => {
                const seller = db.users.find((u) => u.id === p.sellerId);
                return (
                  <tr key={p.id} className="border-b border-line/60 transition last:border-0 hover:bg-pinesoft/30">
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/product/${p.id}`)} className="flex items-center gap-3 text-left">
                        <ProductImage product={p} className="size-10 shrink-0 rounded-lg" />
                        <span className="font-bold transition hover:text-pinedeep">{p.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-inksoft">{seller?.name ?? "—"}</td>
                    <td className="tnum px-4 py-3 font-mono font-bold">{money(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 font-mono text-[12px] font-bold ${p.stock === 0 ? "bg-coralsoft text-coral" : p.stock <= 5 ? "bg-ambersoft text-[#8a5c05]" : "bg-pinesoft text-pinedeep"}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleFeatured(p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                          p.featured ? "border-amber bg-ambersoft text-[#8a5c05]" : "border-line text-inksoft hover:border-amber hover:text-[#8a5c05]"
                        }`}
                      >
                        <IconSpark size={12} /> {p.featured ? "Featured" : "Feature"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeletingId(p.id)} className="grid size-8 place-items-center rounded-lg border border-line transition hover:border-coral hover:text-coral" aria-label={`Remove ${p.name}`}>
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orders" && (
        <div className="anim-rise mt-6 space-y-3">
          {db.orders.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-card/60 px-6 py-12 text-center">
              <p className="font-display text-lg font-extrabold">The order ledger is blank</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-inksoft">
                Real orders placed by signed-in members land here the moment the crate checks out.
              </p>
            </div>
          )}
          {db.orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-card px-4 py-3.5">
              <div>
                <p className="font-mono text-[13.5px] font-bold">{o.id}</p>
                <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{o.buyerName} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
              </div>
              <StatusPill status={o.status} />
              <span className="tnum font-mono text-[14px] font-bold">{money(o.total)}</span>
              <span className="tnum font-mono text-[11.5px] text-inksoft">fee {money(o.fee)}</span>
              <select
                value={o.status}
                onChange={(e) => advanceOrder(o.id, e.target.value as OrderStatus)}
                disabled={o.status === "canceled" || o.status === "delivered"}
                className="ml-auto rounded-md border border-line bg-card px-2.5 py-1.5 font-mono text-[12px] font-bold uppercase outline-none disabled:opacity-50"
              >
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div className="anim-rise mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-6">
            <h2 className="font-display flex items-center gap-2 text-lg font-extrabold"><IconGauge size={18} className="text-plum" /> Market commission</h2>
            <p className="mt-1.5 text-[13.5px] text-inksoft">The house take on every sale. Seller net earnings update everywhere instantly.</p>
            <div className="mt-5 flex items-center gap-4">
              <input type="range" min={0} max={25} value={commission} onChange={(e) => setCommission(+e.target.value)} className="flex-1 accent-[#5B4A6B]" />
              <span className="font-display tnum w-16 text-center text-[26px] font-extrabold text-plum">{commission}%</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-inksoft">on a $100 sale the house keeps {money(commission)} · the stall takes {money(100 - commission)}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-6">
            <h2 className="font-display flex items-center gap-2 text-lg font-extrabold"><IconMegaphone size={18} className="text-plum" /> Megaphone banner</h2>
            <p className="mt-1.5 text-[13.5px] text-inksoft">Shown at the very top of every page. Leave empty to silence it.</p>
            <div className="mt-4">
              <Field label="Announcement" hint={`${announcement.length}/120`}>
                <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value.slice(0, 120))} rows={3} className={`${inputCls} resize-none`} placeholder="Something the whole floor should know…" />
              </Field>
            </div>
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button onClick={saveSettings} className="rounded-lg bg-plum px-6 py-3 text-sm font-extrabold text-card transition hover:brightness-110 active:scale-95">
              Save market settings
            </button>
          </div>
        </div>
      )}

      <Confirm
        open={!!deleting}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deleting && deleteProduct(deleting.id)}
        title="Moderate this listing off the floor?"
        body={`“${deleting?.name}” by ${db.users.find((u) => u.id === deleting?.sellerId)?.name ?? "unknown"} will be removed from the catalog, crates and wishlists. The seller keeps their order history.`}
        dangerLabel="Remove listing"
      />
    </div>
  );
}
