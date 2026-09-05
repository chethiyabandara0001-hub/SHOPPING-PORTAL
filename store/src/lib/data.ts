/* ---------- domain types ---------- */
export type Role = "buyer" | "seller" | "admin";

export interface Address {
  line1: string;
  city: string;
  zip: string;
  country: string;
}

/**
 * Extra account details collected when a member opens a stall — the same
 * essentials Etsy / Shopify / Faire ask for during seller onboarding.
 */
export interface SellerProfile {
  stallName: string;
  businessType: "individual" | "registered";
  phone: string;
  city: string;
  country: string;
  categories: string[];
  bio: string;
  website?: string;
  /** Set during the onboarding wizard's payout step. Absent until then. */
  payout?: { method: "bank" | "paypal"; detail: string };
  createdAt: number;
}

/** A stall is "open for business" once the keeper has configured a payout. */
export const stallComplete = (u: User | undefined | null) => Boolean(u?.seller && u.seller.payout?.detail);

/**
 * A market member profile. Credentials live exclusively in Firebase Auth —
 * KIOSK only stores the uid, public profile and standing. `legacy` marks
 * seed stall records that back the original catalog (they cannot sign in).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  provider?: "password" | "google";
  role: Role;
  blocked: boolean;
  legacy?: boolean;
  seller?: SellerProfile | null;
  color: string;
  joined: number;
  address: Address;
}

/** Public face of a stall — the stall name when set, else the keeper's name. */
export const stallName = (u: User | undefined | null) => u?.seller?.stallName ?? u?.name ?? "Unknown stall";

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  price: number;
  compareAt: number | null;
  stock: number;
  sold: number;
  desc: string;
  image: string | null;
  featured: boolean;
  tags: string[];
  createdAt: number;
}

export type OrderStatus = "pending" | "shipped" | "delivered" | "canceled";

export interface OrderItem {
  productId: string;
  name: string;
  image: string | null;
  qty: number;
  price: number;
  sellerId: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  subtotal: number;
  fee: number;
  total: number;
  status: OrderStatus;
  placedAt: number;
  timeline: { status: OrderStatus; at: number }[];
  address: Address;
  paymentLast4: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  at: number;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Settings {
  commission: number;
  announcement: string;
}

export interface DB {
  v: number;
  users: User[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  wishlists: Record<string, string[]>;
  carts: Record<string, CartLine[]>;
  settings: Settings;
}

/* ---------- helpers ---------- */
export const CATEGORIES = ["Audio", "Desk", "Lighting", "Home", "Accessories", "Wearables"] as const;

export const uid = (p = "id") =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export const timeAgo = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(s / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const fullDate = (t: number) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const AVATAR_COLORS = ["#0E5A47", "#F2A614", "#D9503A", "#5B4A6B", "#2F6690", "#8A6D3B"];

export const hueFromString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

export const productRating = (productId: string, reviews: Review[]) => {
  const rs = reviews.filter((r) => r.productId === productId);
  if (rs.length === 0) return { avg: 0, count: 0 };
  return { avg: rs.reduce((a, r) => a + r.rating, 0) / rs.length, count: rs.length };
};

/* ---------- image fallback tile (deterministic per product) ---------- */
export const tileStyle = (name: string): { bg: string; fg: string } => {
  const h = hueFromString(name);
  return {
    bg: `linear-gradient(140deg, hsl(${h} 26% 86%), hsl(${(h + 40) % 360} 30% 74%))`,
    fg: `hsl(${h} 35% 26%)`,
  };
};

/* ---------- seed ---------- */

/**
 * A truly fresh market: no seeded sellers, products, orders or reviews.
 * Every listing on the floor is created by a real signed-in seller, and the
 * very first member to sign up is handed the admin keys.
 */
export const seedDB = (): DB => ({
  v: 5,
  settings: {
    commission: 0.08,
    announcement: "Fresh floor — the very first seller to list a piece goes live to everyone on day one.",
  },
  users: [],
  products: [],
  orders: [],
  reviews: [],
  wishlists: {},
  carts: { guest: [] },
});
