import { useEffect, useMemo, useState } from "react";
import { navigate, useStore } from "../lib/store";
import type { Route } from "../lib/store";
import { CATEGORIES, money, productRating, stallName } from "../lib/data";
import type { Product } from "../lib/data";
import { ProductImage, Reveal } from "../components/ui";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCheck,
  IconFilter,
  IconHeart,
  IconPlus,
  IconSpark,
  IconStar,
  IconStore,
  IconTag,
  IconX,
} from "../components/Icons";

/* ---------------- product card ---------------- */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { db, addToCart, toggleWish, isWished, user } = useStore();
  const [added, setAdded] = useState(false);
  const wished = isWished(product.id);
  const rating = productRating(product.id, db.reviews);
  const seller = db.users.find((u) => u.id === product.sellerId);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;

  const onAdd = () => {
    if (out) return;
    addToCart(product.id, 1, false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Reveal delay={(index % 4) * 60}>
      <article
        className={`group relative flex flex-col overflow-hidden rounded-xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-pine/40 hover:shadow-[var(--shadow-lift)] ${
          out ? "opacity-75" : ""
        }`}
      >
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="relative block aspect-[4/3.4] w-full overflow-hidden text-left"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            product={product}
            className="absolute inset-0"
            imgClass="transition-transform duration-500 group-hover:scale-[1.06]"
          />
          {out && (
            <span className="absolute left-3 top-3 rounded-md bg-ink/85 px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-card">
              Sold out
            </span>
          )}
          {product.featured && !out && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-amber px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider text-ink">
              <IconSpark size={11} /> Staff pick
            </span>
          )}
          {product.compareAt && (
            <span className="absolute bottom-3 left-3 rounded-md bg-coral px-2 py-0.5 font-mono text-[11px] font-bold text-card">
              −{Math.round((1 - product.price / product.compareAt) * 100)}%
            </span>
          )}
        </button>

        <button
          onClick={() => toggleWish(product.id)}
          className={`absolute right-3 top-3 grid size-9 place-items-center rounded-full border shadow-sm transition-all active:scale-90 ${
            wished
              ? "anim-heart border-coral/40 bg-coral text-card"
              : "border-line bg-card/95 text-inksoft hover:border-coral hover:text-coral"
          }`}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <IconHeart size={15} filled={wished} />
        </button>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-pine">{product.category}</span>
            {rating.count > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[11.5px] font-semibold text-inksoft">
                <IconStar size={11} filled className="text-amber" /> {rating.avg.toFixed(1)} ({rating.count})
              </span>
            )}
          </div>
          <button onClick={() => navigate(`/product/${product.id}`)} className="mt-1.5 text-left">
            <h3 className="font-display text-[16px] font-bold leading-tight tracking-tight transition group-hover:text-pinedeep">
              {product.name}
            </h3>
          </button>
          <button
            onClick={() => navigate(`/?seller=${product.sellerId}`)}
            className="mt-0.5 text-[12px] font-semibold text-inksoft transition hover:text-pine"
          >
            by {seller ? stallName(seller) : "KIOSK"}
          </button>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="tnum font-mono text-[17px] font-bold">{money(product.price)}</span>
                {product.compareAt && (
                  <span className="tnum font-mono text-[12px] text-inksoft line-through">{money(product.compareAt)}</span>
                )}
              </div>
              <p className={`mt-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wide ${out ? "text-coral" : low ? "text-[#8a5c05]" : "text-pine"}`}>
                {out ? "Restocking soon" : low ? `Only ${product.stock} left` : "In stock"}
              </p>
            </div>
            <button
              onClick={onAdd}
              disabled={out}
              className={`grid size-10 place-items-center rounded-lg transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 ${
                added ? "bg-pine text-card" : "bg-ink text-card hover:bg-pinedeep"
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              {added ? <IconCheck size={16} /> : <IconPlus size={16} />}
            </button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* ---------------- ticker ---------------- */
function Ticker() {
  const { db } = useStore();
  const hot = [...db.products].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const items = [...hot, ...hot];
  if (items.length === 0) return null;
  return (
    <div className="overflow-hidden border-y border-line bg-ink py-2 text-card">
      <div className="animate-ticker flex w-max items-center gap-8 whitespace-nowrap">
        {items.map((p, i) => (
          <button
            key={`${p.id}-${i}`}
            onClick={() => navigate(`/product/${p.id}`)}
            className="inline-flex items-center gap-2 font-mono text-[12px] font-semibold tracking-wide transition hover:text-amber"
          >
            <span className="size-1.5 rounded-full bg-amber" />
            {p.name.toUpperCase()} · {money(p.price)} · {p.sold} SOLD
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- hero ---------------- */
function Hero() {
  const { db } = useStore();
  const featured = db.products.filter((p) => p.featured && p.stock > 0).slice(0, 3);
  const [idx, setIdx] = useState(0);
  const fresh = db.products.length === 0;
  const stalls = db.users.filter((u) => u.role === "seller").length;

  useEffect(() => {
    if (featured.length < 2) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % featured.length), 4200);
    return () => window.clearInterval(t);
  }, [featured.length]);

  const current = featured[idx] ?? db.products[0];
  const seller = current ? db.users.find((u) => u.id === current.sellerId) : undefined;

  return (
    <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-12 pt-10 lg:grid-cols-[1.15fr_1fr] lg:px-6 lg:pt-14">
      <div className="anim-rise">
        <p className="inline-flex items-center gap-2 rounded-full border border-pine/30 bg-pinesoft px-3.5 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.13em] text-pinedeep">
          <span className="anim-blink size-1.5 rounded-full bg-pine" /> {fresh ? "Fresh floor · be the first stall" : `Open daily · ${db.products.length} live listings`}
        </p>
        <h1 className="font-display mt-5 text-[clamp(2.5rem,6vw,4.4rem)] font-extrabold leading-[0.98] tracking-tight">
          Good goods,
          <br />
          <span className="relative inline-block">
            honest prices.
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
              <path d="M3 9c60-6 180-7 294-3" stroke="#F2A614" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-inksoft">
          KIOSK is a small marketplace run like a street market — independent stalls, real stock counts, and a
          {` `}{Math.round(db.settings.commission * 100)}% flat commission. No ads, no algorithm, just the floor.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            onClick={() => document.getElementById("floor")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-3 text-[14.5px] font-extrabold text-card shadow-[var(--shadow-lift)] transition hover:bg-pinedeep active:scale-95"
          >
            Walk the floor <IconArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate("/auth?mode=signup")}
            className="inline-flex items-center gap-2 rounded-lg border border-ink px-6 py-3 text-[14.5px] font-extrabold transition hover:bg-ink hover:text-card active:scale-95"
          >
            <IconStore size={16} /> Open a stall
          </button>
        </div>
        <div className="mt-9 flex flex-wrap gap-x-7 gap-y-2">
          {(fresh
            ? [
                ["0", "listings so far"],
                [`${stalls}`, "stall keeper" + (stalls === 1 ? "" : "s")],
                [`${Math.round(db.settings.commission * 100)}%`, "flat commission"],
              ]
            : [
                [`${db.products.reduce((a, p) => a + p.sold, 0)}+`, "pieces sold"],
                [`${stalls}`, "independent stalls"],
                [`${db.products.length}`, "live listings"],
              ]
          ).map(([n, l]) => (
            <div key={l}>
              <p className="font-display tnum text-[22px] font-extrabold text-pinedeep">{n}</p>
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-inksoft">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* fresh-floor panel */}
      {fresh && (
        <div className="anim-rise relative mx-auto w-full max-w-[420px]" style={{ animationDelay: "120ms" }}>
          <div className="absolute -inset-3 rotate-[2.5deg] rounded-2xl border border-line bg-ambersoft/70" />
          <div className="relative overflow-hidden rounded-xl border border-line bg-card p-7 shadow-[var(--shadow-pop)]">
            <div className="stripes-thin absolute inset-y-0 left-0 w-1.5" />
            <p className="inline-flex items-center gap-2 rounded-md bg-pinesoft px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-pinedeep">
              <IconStore size={13} /> Now leasing shelves
            </p>
            <h3 className="font-display mt-4 text-[22px] font-extrabold leading-tight tracking-tight">
              The floor is freshly swept.
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-inksoft">
              No stalls are open yet — which means the very first seller gets the whole market's attention on day one.
              Set up your stall, list a piece, and you're live to every buyer who walks in.
            </p>
            <button
              onClick={() => navigate("/onboarding")}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-5 py-3 text-[14px] font-extrabold text-ink transition hover:brightness-95 active:scale-[0.98]"
            >
              Open the first stall <IconArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* featured card stack */}
      {current && (
        <div className="anim-rise relative mx-auto w-full max-w-[420px]" style={{ animationDelay: "120ms" }}>
          <div className="absolute -inset-3 rotate-[2.5deg] rounded-2xl border border-line bg-ambersoft/70" />
          <button
            onClick={() => navigate(`/product/${current.id}`)}
            className="group relative block w-full overflow-hidden rounded-xl border border-line bg-card text-left shadow-[var(--shadow-pop)] transition hover:-translate-y-1"
          >
            <div className="relative aspect-[5/4] overflow-hidden">
              <ProductImage product={current} className="absolute inset-0" imgClass="transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute left-4 top-4 rounded-md bg-amber px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                On the front shelf
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <div>
                <h3 className="font-display text-lg font-extrabold tracking-tight">{current.name}</h3>
                <p className="mt-0.5 text-[12.5px] font-semibold text-inksoft">by {stallName(seller)} · {current.category}</p>
              </div>
              <div className="text-right">
                <p className="tnum font-mono text-lg font-bold">{money(current.price)}</p>
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-pine transition group-hover:gap-2">
                  View <IconArrowUpRight size={13} />
                </span>
              </div>
            </div>
          </button>
          {featured.length > 1 && (
            <div className="mt-4 flex items-center gap-2">
              {featured.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-7 bg-pine" : "w-3 bg-line hover:bg-inksoft/40"}`}
                  aria-label={`Show featured ${p.name}`}
                />
              ))}
              <span className="ml-auto font-mono text-[10.5px] font-bold uppercase tracking-wider text-inksoft">
                {String(idx + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------- shop page ---------------- */
type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export default function Shop({ route }: { route: Route }) {
  const { db } = useStore();
  const [cat, setCat] = useState<string | null>(route.query.get("cat"));
  const [sellerId, setSellerId] = useState<string | null>(route.query.get("seller"));
  const [q, setQ] = useState(route.query.get("q") ?? "");
  const [maxPrice, setMaxPrice] = useState(400);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCat(route.query.get("cat"));
    setSellerId(route.query.get("seller"));
    setQ(route.query.get("q") ?? "");
  }, [route.query]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 550);
    return () => window.clearTimeout(t);
  }, []);

  const seller = sellerId ? db.users.find((u) => u.id === sellerId) : null;

  const filtered = useMemo(() => {
    let list = [...db.products];
    if (cat) list = list.filter((p) => p.category === cat);
    if (sellerId) list = list.filter((p) => p.sellerId === sellerId);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s)) || p.desc.toLowerCase().includes(s));
    }
    list = list.filter((p) => p.price <= maxPrice);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    const rate = (p: Product) => productRating(p.id, db.reviews).avg;
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => rate(b) - rate(a)); break;
      case "newest": list.sort((a, b) => b.createdAt - a.createdAt); break;
      default: list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold);
    }
    return list;
  }, [db.products, db.reviews, cat, sellerId, q, maxPrice, inStockOnly, sort]);

  const activeFilters = Number(!!cat) + Number(!!sellerId) + Number(!!q) + Number(maxPrice < 400) + Number(inStockOnly);

  const clearAll = () => {
    setCat(null); setSellerId(null); setQ(""); setMaxPrice(400); setInStockOnly(false);
    navigate("/");
  };

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-inksoft">Aisles</h4>
        <div className="mt-3 space-y-1">
          <button
            onClick={() => setCat(null)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13.5px] font-bold transition ${!cat ? "bg-ink text-card" : "hover:bg-pinesoft"}`}
          >
            Everything
            <span className="tnum font-mono text-[11px] opacity-60">{db.products.length}</span>
          </button>
          {CATEGORIES.map((c) => {
            const n = db.products.filter((p) => p.category === c).length;
            if (n === 0) return null;
            return (
              <button
                key={c}
                onClick={() => setCat(cat === c ? null : c)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13.5px] font-bold transition ${cat === c ? "bg-pine text-card" : "hover:bg-pinesoft"}`}
              >
                {c}
                <span className="tnum font-mono text-[11px] opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-inksoft">Max price</h4>
        <input
          type="range"
          min={30}
          max={400}
          step={5}
          value={maxPrice}
          onChange={(e) => setMaxPrice(+e.target.value)}
          className="mt-3 w-full accent-[#0E5A47]"
        />
        <div className="mt-1 flex justify-between font-mono text-[11.5px] font-bold text-inksoft">
          <span>$30</span>
          <span className="rounded bg-pinesoft px-2 py-0.5 text-pinedeep">{maxPrice >= 400 ? "any" : money(maxPrice)}</span>
        </div>
      </div>

      <button
        onClick={() => setInStockOnly((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-line bg-card px-3 py-2.5 transition hover:border-pine"
      >
        <span className="text-[13.5px] font-bold">In stock only</span>
        <span className={`relative h-5 w-9 rounded-full transition ${inStockOnly ? "bg-pine" : "bg-line"}`}>
          <span className={`absolute top-0.5 size-4 rounded-full bg-card shadow transition-all ${inStockOnly ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>

      {activeFilters > 0 && (
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-coral transition hover:underline">
          <IconX size={12} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div>
      <Ticker />
      <Hero />

      {/* category chips */}
      <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {[null, ...CATEGORIES].map((c) => (
            <button
              key={c ?? "all"}
              onClick={() => { setCat(c); if (c) navigate(`/?cat=${c}`); else navigate("/"); }}
              className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-wide transition active:scale-95 ${
                cat === c ? "border-ink bg-ink text-card" : "border-line bg-card text-inksoft hover:border-ink hover:text-ink"
              }`}
            >
              {c ?? "All aisles"}
            </button>
          ))}
        </div>
      </div>

      {/* floor */}
      <section id="floor" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 pt-8 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-[110px] rounded-xl border border-line bg-card p-4">{filterPanel}</div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[26px] font-extrabold tracking-tight">
                  {seller ? stallName(seller) : cat ? `${cat} aisle` : q ? `Results for “${q}”` : "The floor"}
                </h2>
                <p className="mt-0.5 font-mono text-[11.5px] font-bold uppercase tracking-wider text-inksoft">
                  {filtered.length} listing{filtered.length === 1 ? "" : "s"}
                  {activeFilters > 0 && ` · ${activeFilters} filter${activeFilters > 1 ? "s" : ""} on`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-bold lg:hidden"
                >
                  <IconFilter size={14} /> Filters {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-amber font-mono text-[10.5px]">{activeFilters}</span>}
                </button>
                <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-inksoft">Sort</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="bg-transparent text-[13px] font-bold outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price ↑</option>
                    <option value="price-desc">Price ↓</option>
                    <option value="rating">Top rated</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-line bg-card">
                    <div className="skeleton aspect-[4/3.4]" />
                    <div className="space-y-2 p-4">
                      <div className="skeleton h-3 w-1/3 rounded" />
                      <div className="skeleton h-4 w-4/5 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="anim-rise mt-6 rounded-xl border border-dashed border-line bg-card/60 px-6 py-16 text-center">
                <p className="font-display text-xl font-bold">
                  {db.products.length === 0 ? "The floor is waiting for its first stall." : "The shelf is bare here."}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-inksoft">
                  {db.products.length === 0
                    ? "Nobody has listed a piece yet. Open a stall, put something good on the shelf, and own the front page."
                    : "No listings match that combination. Loosen a filter or two and something good will turn up."}
                </p>
                {db.products.length === 0 ? (
                  <button onClick={() => navigate("/onboarding")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-extrabold text-ink transition hover:brightness-95">
                    <IconStore size={15} /> Open a stall
                  </button>
                ) : (
                  <button onClick={clearAll} className="mt-5 rounded-lg bg-pine px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}

            {/* sell banner */}
            <Reveal className="mt-12">
              <div className="relative overflow-hidden rounded-xl bg-pinedeep px-6 py-8 text-card sm:px-10">
                <div className="stripes-thin absolute inset-y-0 left-0 w-2 opacity-80" />
                <div className="flex flex-wrap items-center justify-between gap-5 pl-4">
                  <div>
                    <p className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-amber">
                      <IconTag size={13} /> For makers
                    </p>
                    <h3 className="font-display mt-2 text-[24px] font-extrabold leading-tight tracking-tight sm:text-[28px]">
                      Got something good? Rent a shelf.
                    </h3>
                    <p className="mt-2 max-w-md text-[14px] text-card/75">
                      List in two minutes, keep {100 - Math.round(db.settings.commission * 100)}% of every sale, and watch your stock move from the Seller Studio.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/auth?mode=signup")}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-3 text-[14.5px] font-extrabold text-ink transition hover:brightness-95 active:scale-95"
                  >
                    Start selling <IconArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* mobile filters sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button className="anim-fade absolute inset-0 bg-ink/55" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <div className="anim-drawer-left absolute left-0 top-0 h-full w-[min(86vw,320px)] overflow-y-auto border-r border-line bg-paper p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="grid size-9 place-items-center rounded-lg border border-line" aria-label="Close">
                <IconX size={15} />
              </button>
            </div>
            {filterPanel}
            <button onClick={() => setFiltersOpen(false)} className="mt-6 w-full rounded-lg bg-pine py-3 text-sm font-extrabold text-card">
              Show {filtered.length} listing{filtered.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
