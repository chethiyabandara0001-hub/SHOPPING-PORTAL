import { useMemo, useState } from "react";
import { navigate, useStore } from "../lib/store";
import { money, productRating, stallName, timeAgo, fullDate } from "../lib/data";
import { ProductImage, Qty, Stars, StarInput, Field, inputCls, Reveal } from "../components/ui";
import { ProductCard } from "./Shop";
import {
  IconArrowRight,
  IconCart,
  IconChevronRight,
  IconHeart,
  IconPackage,
  IconShield,
  IconStar,
  IconStore,
  IconTruck,
} from "../components/Icons";

export default function ProductPage({ id }: { id: string }) {
  const { db, user, addToCart, toggleWish, isWished, addReview, canReview, toast } = useStore();
  const product = db.products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const reviews = useMemo(
    () => db.reviews.filter((r) => r.productId === id).sort((a, b) => b.at - a.at),
    [db.reviews, id],
  );
  const rate = productRating(id, db.reviews);

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-display text-3xl font-extrabold">That listing walked off the floor.</p>
        <p className="mt-3 text-inksoft">It may have been removed by its seller or the admin desk.</p>
        <button onClick={() => navigate("/")} className="mt-6 rounded-lg bg-pine px-6 py-3 text-sm font-bold text-card transition hover:bg-pinedeep">
          Back to the floor
        </button>
      </div>
    );
  }

  const seller = db.users.find((u) => u.id === product.sellerId);
  const wished = isWished(product.id);
  const out = product.stock <= 0;
  const moreFromSeller = db.products.filter((p) => p.sellerId === product.sellerId && p.id !== product.id).slice(0, 4);
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));
  const eligible = canReview(product.id);

  const buyNow = () => {
    addToCart(product.id, qty, false);
    navigate(user ? "/checkout" : "/auth?next=checkout");
  };

  const submitReview = () => {
    if (text.trim().length < 8) {
      toast("Give the review at least a sentence — 8 characters minimum.", "error");
      return;
    }
    addReview(product.id, rating, text);
    setText("");
    setRating(5);
    setReviewOpen(false);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6">
      {/* breadcrumb */}
      <nav className="anim-fade flex items-center gap-1.5 font-mono text-[11.5px] font-bold uppercase tracking-wider text-inksoft">
        <button onClick={() => navigate("/")} className="transition hover:text-pine">Floor</button>
        <IconChevronRight size={11} />
        <button onClick={() => navigate(`/?cat=${product.category}`)} className="transition hover:text-pine">{product.category}</button>
        <IconChevronRight size={11} />
        <span className="truncate normal-case tracking-normal text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr]">
        {/* image side */}
        <div className="anim-rise">
          <div className="group relative overflow-hidden rounded-xl border border-line bg-card shadow-[var(--shadow-lift)]">
            <ProductImage product={product} className="aspect-square w-full" imgClass="transition-transform duration-700 group-hover:scale-[1.04]" />
            {product.featured && (
              <span className="absolute left-4 top-4 rounded-md bg-amber px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink">Staff pick</span>
            )}
            {product.compareAt && (
              <span className="absolute bottom-4 left-4 rounded-md bg-coral px-3 py-1.5 font-mono text-[12px] font-bold text-card">
                Save {money(product.compareAt - product.price)}
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: <IconTruck size={17} />, t: "Free shipping", s: "2–4 day delivery" },
              { icon: <IconShield size={17} />, t: "Buyer cover", s: "30-day returns" },
              { icon: <IconPackage size={17} />, t: "Real stock", s: `${product.stock} on the shelf` },
            ].map((b) => (
              <div key={b.t} className="rounded-xl border border-line bg-card px-3 py-3 text-center">
                <span className="mx-auto grid size-8 place-items-center rounded-lg bg-pinesoft text-pine">{b.icon}</span>
                <p className="mt-2 text-[12.5px] font-bold leading-tight">{b.t}</p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft">{b.s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* buy side */}
        <div className="anim-rise" style={{ animationDelay: "80ms" }}>
          <p className="font-mono text-[11.5px] font-bold uppercase tracking-[0.14em] text-pine">{product.category}</p>
          <h1 className="font-display mt-2 text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight">{product.name}</h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            {rate.count > 0 ? (
              <button onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 text-[13px] font-semibold text-inksoft transition hover:text-ink">
                <Stars value={rate.avg} /> {rate.avg.toFixed(1)} · {rate.count} review{rate.count > 1 ? "s" : ""}
              </button>
            ) : (
              <span className="text-[13px] font-semibold text-inksoft">No reviews yet — be first on the block</span>
            )}
            <span className="font-mono text-[12px] font-semibold text-inksoft">· {product.sold} sold</span>
          </div>

          <div className="mt-5 flex items-baseline gap-2.5">
            <span className="tnum font-mono text-[34px] font-bold leading-none">{money(product.price)}</span>
            {product.compareAt && (
              <span className="tnum font-mono text-[17px] text-inksoft line-through">{money(product.compareAt)}</span>
            )}
          </div>

          {/* stock meter */}
          <div className="mt-5 rounded-xl border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${out ? "text-coral" : product.stock <= 5 ? "text-[#8a5c05]" : "text-pine"}`}>
                {out ? "Sold out" : product.stock <= 5 ? `Low stock — ${product.stock} left` : `In stock — ${product.stock} available`}
              </span>
              <span className="font-mono text-[11px] text-inksoft">shelf capacity 30</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div
                className={`anim-bar h-full rounded-full ${out ? "bg-coral" : product.stock <= 5 ? "bg-amber" : "bg-pine"}`}
                style={{ width: `${Math.max(4, Math.min(100, (product.stock / 30) * 100))}%` }}
              />
            </div>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-inksoft">{product.desc}</p>

          {product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <span key={t} className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-[11px] font-semibold text-inksoft">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Qty value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <button
              onClick={() => addToCart(product.id, qty)}
              disabled={out}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-[14.5px] font-extrabold text-card transition hover:bg-pinedeep active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <IconCart size={17} /> Add to crate
            </button>
            <button
              onClick={buyNow}
              disabled={out}
              className="inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-3 text-[14.5px] font-extrabold text-ink transition hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Buy now <IconArrowRight size={15} />
            </button>
            <button
              onClick={() => toggleWish(product.id)}
              className={`grid size-12 place-items-center rounded-lg border transition active:scale-90 ${
                wished ? "anim-heart border-coral/40 bg-coralsoft text-coral" : "border-line bg-card text-inksoft hover:border-coral hover:text-coral"
              }`}
              aria-label="Toggle wishlist"
            >
              <IconHeart size={19} filled={wished} />
            </button>
          </div>

          {/* seller card */}
          {seller && (
            <div className="mt-7 flex items-center gap-4 rounded-xl border border-line bg-card p-4">
              <span className="font-display grid size-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-card" style={{ background: seller.color }}>
                {stallName(seller).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-[14.5px] font-bold">
                  <IconStore size={14} className="text-pine" /> {stallName(seller)}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
                  {db.products.filter((p) => p.sellerId === seller.id).length} listings · on KIOSK since {fullDate(seller.joined).split(",")[0]}
                  {seller.seller && ` · ships from ${seller.seller.city}, ${seller.seller.country}`}
                </p>
              </div>
              <button
                onClick={() => navigate(`/?seller=${seller.id}`)}
                className="shrink-0 rounded-lg border border-line px-4 py-2 text-[12.5px] font-bold transition hover:border-pine hover:text-pinedeep"
              >
                Visit stall
              </button>
            </div>
          )}
        </div>
      </div>

      {/* reviews */}
      <section id="reviews" className="mt-16 scroll-mt-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[24px] font-extrabold tracking-tight">Word on the street</h2>
              <p className="mt-1 font-mono text-[11.5px] font-bold uppercase tracking-wider text-inksoft">{rate.count} review{rate.count === 1 ? "" : "s"}</p>
            </div>
            {eligible ? (
              <button onClick={() => setReviewOpen((v) => !v)} className="rounded-lg bg-pine px-5 py-2.5 text-[13.5px] font-bold text-card transition hover:bg-pinedeep active:scale-95">
                {reviewOpen ? "Close review form" : "Review this piece"}
              </button>
            ) : user ? (
              <p className="font-mono text-[11px] uppercase tracking-wide text-inksoft">Reviews open after a delivered order</p>
            ) : (
              <button onClick={() => navigate("/auth")} className="text-[13px] font-bold text-pine underline-offset-4 hover:underline">
                Sign in to review
              </button>
            )}
          </div>
        </Reveal>

        {reviewOpen && eligible && (
          <div className="anim-pop mt-5 rounded-xl border border-pine/30 bg-card p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Field label="Your rating"><StarInput value={rating} onChange={setRating} /></Field>
            </div>
            <div className="mt-4">
              <Field label="Your take" hint={`${text.length}/400`}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 400))}
                  rows={3}
                  placeholder="How's the build? Would you buy it again?"
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
            <button onClick={submitReview} className="mt-4 rounded-lg bg-amber px-6 py-2.5 text-[13.5px] font-extrabold text-ink transition hover:brightness-95 active:scale-95">
              Post review
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-fit rounded-xl border border-line bg-card p-5">
            <div className="flex items-end gap-3">
              <span className="font-display tnum text-[44px] font-extrabold leading-none">{rate.count ? rate.avg.toFixed(1) : "—"}</span>
              <div className="pb-1.5">
                <Stars value={rate.avg} size={15} />
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{rate.count} ratings</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {dist.map((d) => (
                <div key={d.n} className="flex items-center gap-2">
                  <span className="inline-flex w-6 items-center gap-0.5 font-mono text-[11.5px] font-bold">{d.n}<IconStar size={10} filled className="text-amber" /></span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="anim-bar h-full rounded-full bg-amber" style={{ width: rate.count ? `${(d.count / rate.count) * 100}%` : "0%" }} />
                  </div>
                  <span className="tnum w-5 text-right font-mono text-[11.5px] text-inksoft">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {reviews.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-card/60 px-6 py-12 text-center">
                <p className="font-display text-lg font-bold">Street's quiet on this one.</p>
                <p className="mt-1.5 text-sm text-inksoft">Order it, live with it, and tell the floor how it goes.</p>
              </div>
            )}
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 50}>
                <div className="rounded-xl border border-line bg-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display grid size-9 place-items-center rounded-full bg-pinesoft text-[13px] font-extrabold text-pinedeep">
                        {r.userName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-[14px] font-bold">{r.userName}</p>
                        <p className="font-mono text-[10.5px] uppercase tracking-wide text-inksoft">{timeAgo(r.at)} · verified buyer</p>
                      </div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-inksoft">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* more from seller */}
      {moreFromSeller.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-[24px] font-extrabold tracking-tight">More from {stallName(seller)}</h2>
            <button onClick={() => navigate(`/?seller=${product.sellerId}`)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-pine transition hover:gap-2.5">
              View all <IconArrowRight size={14} />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {moreFromSeller.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
