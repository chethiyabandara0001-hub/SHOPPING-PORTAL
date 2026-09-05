import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "../lib/store";
import type { OrderStatus, Product } from "../lib/data";
import { tileStyle } from "../lib/data";
import { IconAlert, IconCheck, IconMinus, IconPlus, IconStar, IconX } from "./Icons";

/* ---------------- toasts ---------------- */
export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`anim-toast flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-[var(--shadow-pop)] backdrop-blur-sm ${
            t.kind === "success"
              ? "border-pine/30 bg-pinedeep text-card"
              : t.kind === "error"
                ? "border-coral/40 bg-[#4b1710] text-[#fde8e2]"
                : "border-line bg-ink text-card"
          }`}
          role="status"
        >
          <span
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
              t.kind === "success" ? "bg-amber text-ink" : t.kind === "error" ? "bg-coral text-card" : "bg-card/20"
            }`}
          >
            {t.kind === "error" ? <IconX size={11} /> : <IconCheck size={11} />}
          </span>
          <p className="flex-1 text-[13.5px] font-medium leading-snug">{t.text}</p>
          <button
            onClick={() => dismissToast(t.id)}
            className="mt-0.5 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <IconX size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button className="anim-fade absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div
        className={`anim-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-line bg-card shadow-[var(--shadow-pop)] sm:rounded-xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-5 py-3.5">
          <h3 className="font-display text-[17px] font-bold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md border border-line text-inksoft transition hover:border-ink hover:text-ink"
            aria-label="Close modal"
          >
            <IconX size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  body,
  dangerLabel = "Confirm",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  dangerLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-coralsoft text-coral">
          <IconAlert size={18} />
        </span>
        <p className="text-sm leading-relaxed text-inksoft">{body}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition hover:border-ink"
        >
          Keep it
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-card transition hover:bg-[#b93f2b] active:scale-[0.97]"
        >
          {dangerLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- rating stars ---------------- */
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[1.5px] text-amber">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} filled={i <= Math.round(value)} className={i <= Math.round(value) ? "" : "opacity-30"} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className={`transition-transform hover:scale-115 ${i <= (hover || value) ? "text-amber" : "text-line"}`}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <IconStar size={26} filled={i <= (hover || value)} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- quantity stepper ---------------- */
export function Qty({
  value,
  onChange,
  max = 99,
  small,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  small?: boolean;
}) {
  const btn = `grid place-items-center text-inksoft transition hover:bg-pinesoft hover:text-pinedeep disabled:opacity-30 disabled:hover:bg-transparent ${
    small ? "size-7" : "size-9"
  }`;
  return (
    <div className={`inline-flex items-center rounded-lg border border-line bg-card ${small ? "h-8" : "h-10"}`}>
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <IconMinus size={small ? 12 : 14} />
      </button>
      <span className={`tnum font-mono font-semibold ${small ? "w-7 text-[13px]" : "w-9 text-sm"}`}>{value}</span>
      <button
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <IconPlus size={small ? 12 : 14} />
      </button>
    </div>
  );
}

/* ---------------- status pill ---------------- */
export const STATUS_META: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending: { label: "Pending", cls: "bg-ambersoft text-[#8a5c05] border-amber/40", dot: "bg-amber" },
  shipped: { label: "Shipped", cls: "bg-pinesoft text-pinedeep border-pine/30", dot: "bg-pine" },
  delivered: { label: "Delivered", cls: "bg-pine text-card border-pine", dot: "bg-card" },
  canceled: { label: "Canceled", cls: "bg-coralsoft text-coral border-coral/40", dot: "bg-coral" },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11.5px] font-bold uppercase tracking-wide ${m.cls}`}>
      <span className={`size-1.5 rounded-full ${m.dot} ${status === "pending" ? "anim-blink" : ""}`} />
      {m.label}
    </span>
  );
}

/* ---------------- product image with deterministic fallback ---------------- */
export function ProductImage({
  product,
  className,
  imgClass,
}: {
  product: Pick<Product, "name" | "image">;
  className?: string;
  imgClass?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = product.image && !broken;
  const tile = tileStyle(product.name);
  const initials = product.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={showImage ? undefined : { background: tile.bg }}>
      {showImage ? (
        <img
          src={product.image ?? undefined}
          alt={product.name}
          loading="lazy"
          onError={() => setBroken(true)}
          className={`size-full object-cover ${imgClass ?? ""}`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="font-display text-4xl font-extrabold tracking-tight"
            style={{ color: tile.fg }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- scroll reveal ---------------- */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className ?? ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- misc ---------------- */
export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`anim-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="anim-rise flex flex-col items-center rounded-xl border border-dashed border-line bg-card/60 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-xl bg-pinesoft text-pine">{icon}</div>
      <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-inksoft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[12.5px] font-bold uppercase tracking-wide text-inksoft">
        {label}
        {hint && <em className="font-mono text-[10.5px] font-medium normal-case not-italic opacity-70">{hint}</em>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[12.5px] font-semibold text-coral">{error}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-inksoft/50 transition focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/15";

export function Avatar({ name, color, size = 34 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="font-display grid shrink-0 place-items-center rounded-full font-bold text-card"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3.5 py-1.5 text-[13px] font-bold transition-all ${
            value === o.value ? "bg-ink text-card shadow-sm" : "text-inksoft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
