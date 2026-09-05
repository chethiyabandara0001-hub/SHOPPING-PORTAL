import { useEffect, useMemo, useRef, useState } from "react";
import { navigate, useStore } from "../lib/store";
import { CATEGORIES, money } from "../lib/data";
import { Avatar, ProductImage, Qty } from "./ui";
import {
  IconArrowRight,
  IconCart,
  IconChevronDown,
  IconHeart,
  IconLogout,
  IconMenu,
  IconReceipt,
  IconSearch,
  IconShield,
  IconStore,
  IconTrash,
  IconUser,
  IconX,
  Logo,
} from "./Icons";

/* ================= header ================= */
export function Header({ route }: { route: string }) {
  const { db, user, cart, setCartOpen, logout } = useStore();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return { products: [], cats: [] as string[] };
    return {
      products: db.products.filter((p) => p.name.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s))).slice(0, 5),
      cats: CATEGORIES.filter((c) => c.toLowerCase().includes(s)),
    };
  }, [q, db.products]);

  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  const go = (to: string) => {
    navigate(to);
    setMobileOpen(false);
    setMenuOpen(false);
  };

  const submitSearch = () => {
    if (!q.trim()) return;
    go(`/?q=${encodeURIComponent(q.trim())}`);
    setQ("");
    setSearchOpen(false);
  };

  const navLink = (label: string, to: string, active: boolean) => (
    <button
      onClick={() => go(to)}
      className={`relative px-1 py-1.5 text-[14px] font-bold transition ${active ? "text-pinedeep" : "text-inksoft hover:text-ink"}`}
    >
      {label}
      <span
        className={`absolute -bottom-0.5 left-0 h-[2.5px] rounded-full bg-amber transition-all ${active ? "w-full" : "w-0"}`}
      />
    </button>
  );

  return (
    <header className="sticky top-0 z-[60]">
      {db.settings.announcement.trim() && (
        <div className="bg-pinedeep px-4 py-1.5 text-center text-[12.5px] font-semibold tracking-wide text-card">
          <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-amber align-middle" />
          {db.settings.announcement}
        </div>
      )}
      <div className="stripes-awning h-[5px]" />
      <div className="border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center gap-3 px-4 sm:gap-5 lg:px-6">
          <button
            className="grid size-9 place-items-center rounded-lg border border-line lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <IconX size={17} /> : <IconMenu size={17} />}
          </button>

          <button onClick={() => go("/")} className="flex items-center gap-2.5" aria-label="KIOSK home">
            <Logo size={32} />
            <span className="font-display hidden text-[21px] font-extrabold tracking-tight sm:block">
              KIOSK<span className="text-amber">.</span>
            </span>
          </button>

          <nav className="ml-2 hidden items-center gap-5 lg:flex">
            {navLink("The Floor", "/", route === "/")}
            {user?.role === "seller" && navLink("Seller Studio", "/seller", route === "/seller")}
            {user?.role === "admin" && navLink("Admin Desk", "/admin", route === "/admin")}
          </nav>

          {/* search */}
          <div ref={searchRef} className="relative ml-auto hidden w-full max-w-[380px] md:block">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 transition focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/15">
              <IconSearch size={15} className="shrink-0 text-inksoft" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Search the floor…"
                className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:text-inksoft/50"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-inksoft hover:text-ink" aria-label="Clear search">
                  <IconX size={13} />
                </button>
              )}
            </div>
            {searchOpen && q.trim().length >= 2 && (
              <div className="anim-pop absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-xl border border-line bg-card shadow-[var(--shadow-pop)]">
                {matches.products.length === 0 && matches.cats.length === 0 ? (
                  <p className="px-4 py-5 text-center text-sm text-inksoft">
                    Nothing on the floor matches “{q.trim()}”.
                  </p>
                ) : (
                  <>
                    {matches.cats.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2.5">
                        {matches.cats.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              go(`/?cat=${c}`);
                              setQ("");
                              setSearchOpen(false);
                            }}
                            className="rounded-full bg-pinesoft px-3 py-1 text-[12px] font-bold text-pinedeep transition hover:bg-pinemist"
                          >
                            in {c}
                          </button>
                        ))}
                      </div>
                    )}
                    {matches.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          go(`/product/${p.id}`);
                          setQ("");
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-pinesoft/60"
                      >
                        <ProductImage product={p} className="size-10 shrink-0 rounded-md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold">{p.name}</span>
                          <span className="text-[11.5px] uppercase tracking-wide text-inksoft">{p.category}</span>
                        </span>
                        <span className="tnum font-mono text-[13.5px] font-bold">{money(p.price)}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* actions */}
          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            {(!user || user.role === "buyer") && (
              <button
                onClick={() => go(user ? "/onboarding" : "/auth?mode=signup&role=seller")}
                className="hidden items-center gap-1.5 rounded-lg bg-amber px-3.5 py-2.5 text-[13px] font-extrabold text-ink transition hover:brightness-95 active:scale-95 md:inline-flex"
              >
                <IconStore size={15} /> Sell on KIOSK
              </button>
            )}
            <button
              onClick={() => go(user ? "/account?tab=wishlist" : "/auth")}
              className="hidden size-10 place-items-center rounded-lg border border-line bg-card text-inksoft transition hover:border-ink hover:text-ink sm:grid"
              aria-label="Wishlist"
            >
              <IconHeart size={17} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative grid size-10 place-items-center rounded-lg border border-line bg-card transition hover:border-ink active:scale-95"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <IconCart size={17} />
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="anim-pop tnum absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-amber px-1 font-mono text-[10.5px] font-bold text-ink"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-card py-1 pl-1 pr-2 transition hover:border-ink"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} color={user.color} size={30} />
                  <IconChevronDown size={13} className={`text-inksoft transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>
                {menuOpen && (
                  <>
                    <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                    <div className="anim-pop absolute right-0 top-[calc(100%+8px)] z-20 w-56 overflow-hidden rounded-xl border border-line bg-card shadow-[var(--shadow-pop)]">
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-[14px] font-bold">{user.name}</p>
                        <p className="truncate font-mono text-[11px] uppercase tracking-wide text-inksoft">{user.role} account</p>
                      </div>
                      <div className="p-1.5">
                        {[
                          { label: "My account", icon: <IconUser size={15} />, to: "/account" },
                          { label: "Orders", icon: <IconReceipt size={15} />, to: "/account?tab=orders" },
                          ...(user.role === "seller" ? [{ label: "Seller Studio", icon: <IconStore size={15} />, to: "/seller" }] : []),
                          ...(user.role === "admin" ? [{ label: "Admin Desk", icon: <IconShield size={15} />, to: "/admin" }] : []),
                        ].map((item) => (
                          <button
                            key={item.to + item.label}
                            onClick={() => go(item.to)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold transition hover:bg-pinesoft"
                          >
                            <span className="text-pine">{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                            go("/");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold text-coral transition hover:bg-coralsoft"
                        >
                          <IconLogout size={15} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => go("/auth")}
                className="hidden rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-bold text-card transition hover:bg-pinedeep active:scale-95 sm:block"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* mobile sheet */}
        {mobileOpen && (
          <div className="anim-rise border-t border-line bg-card px-4 py-4 lg:hidden">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 md:hidden">
              <IconSearch size={15} className="text-inksoft" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitSearch();
                    setMobileOpen(false);
                  }
                }}
                placeholder="Search the floor…"
                className="w-full bg-transparent py-2.5 text-[14px] outline-none"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => go("/")} className="rounded-lg border border-line px-3 py-2.5 text-left text-[13.5px] font-bold transition hover:border-ink">The Floor</button>
              <button onClick={() => go(user ? "/account" : "/auth")} className="rounded-lg border border-line px-3 py-2.5 text-left text-[13.5px] font-bold transition hover:border-ink">
                {user ? "My account" : "Sign in"}
              </button>
              {user?.role === "seller" && (
                <button onClick={() => go("/seller")} className="rounded-lg border border-line px-3 py-2.5 text-left text-[13.5px] font-bold">Seller Studio</button>
              )}
              {user?.role === "admin" && (
                <button onClick={() => go("/admin")} className="rounded-lg border border-line px-3 py-2.5 text-left text-[13.5px] font-bold">Admin Desk</button>
              )}
              {user?.role === "buyer" && (
                <button onClick={() => go("/onboarding")} className="rounded-lg bg-amber px-3 py-2.5 text-left text-[13.5px] font-extrabold text-ink">Sell on KIOSK</button>
              )}
              {!user && (
                <button onClick={() => go("/auth?mode=signup&role=seller")} className="rounded-lg bg-pine px-3 py-2.5 text-left text-[13.5px] font-bold text-card">Open a stall</button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ================= cart drawer ================= */
export function CartDrawer() {
  const { db, cart, cartOpen, setCartOpen, setCartQty, removeFromCart, user } = useStore();
  const lines = cart.flatMap((l) => {
    const p = db.products.find((x) => x.id === l.productId);
    return p ? [{ ...l, product: p }] : [];
  });
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="anim-fade absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} aria-label="Close cart" />
      <aside className="anim-drawer absolute right-0 top-0 flex h-full w-[min(94vw,420px)] flex-col border-l border-line bg-paper shadow-[var(--shadow-pop)]">
        <div className="flex items-center justify-between border-b border-line bg-card px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight">Your crate</h2>
            <p className="font-mono text-[11px] uppercase tracking-wider text-inksoft">
              {lines.length} listing{lines.length === 1 ? "" : "s"} · {lines.reduce((a, l) => a + l.qty, 0)} items
            </p>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="grid size-9 place-items-center rounded-lg border border-line transition hover:border-ink"
            aria-label="Close cart"
          >
            <IconX size={16} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-pinesoft text-pine">
              <IconCart size={26} />
            </div>
            <h3 className="font-display mt-4 text-lg font-bold">Nothing in the crate yet</h3>
            <p className="mt-1.5 text-sm text-inksoft">Walk the floor and toss something good in here.</p>
            <button
              onClick={() => {
                setCartOpen(false);
                navigate("/");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-pine px-5 py-2.5 text-sm font-bold text-card transition hover:bg-pinedeep active:scale-95"
            >
              Browse the floor <IconArrowRight size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {lines.map((l) => (
                <div key={l.productId} className="anim-rise flex gap-3 rounded-xl border border-line bg-card p-3">
                  <button onClick={() => { setCartOpen(false); navigate(`/product/${l.product.id}`); }}>
                    <ProductImage product={l.product} className="size-[72px] shrink-0 rounded-lg" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13.5px] font-bold">{l.product.name}</p>
                      <button
                        onClick={() => removeFromCart(l.productId)}
                        className="text-inksoft transition hover:text-coral"
                        aria-label={`Remove ${l.product.name}`}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-[11.5px] uppercase tracking-wide text-inksoft">{l.product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Qty small value={l.qty} max={l.product.stock} onChange={(v) => setCartQty(l.productId, v)} />
                      <span className="tnum font-mono text-[14px] font-bold">{money(l.product.price * l.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line bg-card px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-inksoft">Subtotal</span>
                <span className="tnum font-mono text-lg font-bold">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-[12px] text-inksoft">Free shipping on every crate. Taxes at the door: $0.</p>
              <button
                onClick={() => {
                  setCartOpen(false);
                  navigate(user ? "/checkout" : "/auth?next=checkout");
                }}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-lg bg-amber py-3 text-[15px] font-extrabold text-ink transition hover:brightness-95 active:scale-[0.98]"
              >
                {user ? "Check out" : "Sign in to check out"} <IconArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/* ================= footer ================= */
export function Footer() {
  const { db } = useStore();
  const commissionPct = Math.round(db.settings.commission * 100);
  return (
    <footer className="mt-20 border-t border-line bg-pinedeep text-card">
      <div className="stripes-awning h-[5px] opacity-90" />
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="font-display text-xl font-extrabold">KIOSK<span className="text-amber">.</span></span>
          </div>
          <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-card/70">
            A small marketplace for good goods at honest prices. Eight stalls, one floor, zero dark patterns.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-card/20 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-card/70">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            secure sign-in · Google &amp; email
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[11.5px] font-bold uppercase tracking-[0.14em] text-amber">Aisles</h4>
          <ul className="mt-3.5 space-y-2 text-[13.5px] font-semibold text-card/80">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button onClick={() => navigate(`/?cat=${c}`)} className="transition hover:text-amber">
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[11.5px] font-bold uppercase tracking-[0.14em] text-amber">Sell on KIOSK</h4>
          <ul className="mt-3.5 space-y-2 text-[13.5px] font-semibold text-card/80">
            <li><button onClick={() => navigate("/auth?mode=signup&role=seller")} className="transition hover:text-amber">Open a stall</button></li>
            <li><button onClick={() => navigate("/onboarding")} className="transition hover:text-amber">Become a seller</button></li>
            <li><button onClick={() => navigate("/seller")} className="transition hover:text-amber">Seller Studio</button></li>
            <li><button onClick={() => navigate("/admin")} className="transition hover:text-amber">Admin Desk</button></li>
            <li><button onClick={() => navigate("/account")} className="transition hover:text-amber">My account</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[11.5px] font-bold uppercase tracking-[0.14em] text-amber">House rules</h4>
          <p className="mt-3.5 text-[13px] leading-relaxed text-card/70">
            {commissionPct}% seller commission · payouts every Friday ·
            returns within 30 days, no interrogation.
          </p>
          <p className="mt-4 font-mono text-[11px] text-card/50">© 2026 KIOSK Market Co. — checkout runs on a simulated gateway; no card is ever charged.</p>
        </div>
      </div>
    </footer>
  );
}
