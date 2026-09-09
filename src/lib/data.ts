/* ---------- domain types ---------- */
export type Role = "buyer" | "seller" | "admin";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
}

/**
 * Extra account details collected when the admin opens the textile shop.
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
  payout?: { method: "bank" | "paypal"; detail: string };
  createdAt: number;
}

export const stallComplete = (u: User | undefined | null) => Boolean(u?.seller && u.seller.payout?.detail);

/**
 * A market member profile. The first user becomes admin/seller automatically.
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

export const stallName = (u: User | undefined | null) => u?.seller?.stallName ?? u?.name ?? "Viora";

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAt: number | null;
  stock: number;
  sold: number;
  desc: string;
  material?: string;
  dimensions?: string;
  careInstructions?: string;
  image: string | null;
  images?: string[];
  featured: boolean;
  tags: string[];
  createdAt: number;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

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
  buyerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  fee: number;
  total: number;
  status: OrderStatus;
  placedAt: number;
  timeline: { status: OrderStatus; at: number; note?: string }[];
  address: Address;
  paymentLast4: string;
  notes?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  at: number;
  verified?: boolean;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Settings {
  commission: number;
  announcement: string;
  shippingRates: { region: string; rate: number }[];
  currency: string;
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
export const TEXTILE_CATEGORIES = [
  "Silk",
  "Cotton",
  "Linen",
  "Wool",
  "Velvet",
  "Denim",
  "Embroidered",
  "Printed",
  "Organic",
  "Vintage",
] as const;

export const CATEGORIES = TEXTILE_CATEGORIES;

export const uid = (p = "id") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export const timeAgo = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const fullDate = (t: number) =>
  new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export const AVATAR_COLORS = ["#8B4513", "#D4AF37", "#C0C0C0", "#2F4F4F", "#8B0000", "#483D8B"];

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

/* ---------- elegant tile for textiles ---------- */
export const tileStyle = (name: string): { bg: string; fg: string } => {
  const h = hueFromString(name);
  return {
    bg: `linear-gradient(135deg, hsl(${h} 30% 92%), hsl(${(h + 35) % 360} 25% 88%))`,
    fg: `hsl(${h} 40% 25%)`,
  };
};

/* ---------- seed with sample textile products ---------- */
export const seedDB = (): DB => ({
  v: 5,
  settings: {
    commission: 0,
    announcement: "Welcome to Viora — Your destination for premium textiles and fabrics.",
    shippingRates: [
      { region: "Domestic", rate: 8.99 },
      { region: "International", rate: 24.99 },
    ],
    currency: "USD",
  },
  users: [],
  products: [
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Pure Mulberry Silk Fabric",
      category: "Silk",
      subcategory: "Plain Weave",
      price: 45.00,
      compareAt: 65.00,
      stock: 24,
      sold: 0,
      desc: "Luxurious 100% pure mulberry silk fabric with a smooth, lustrous finish. Perfect for evening wear, scarves, and luxury linings. Weight: 16 momme.",
      material: "100% Mulberry Silk",
      dimensions: "45 inches wide, sold by the yard",
      careInstructions: "Dry clean only or hand wash cold with silk detergent",
      image: null,
      images: [],
      featured: true,
      tags: ["silk", "luxury", "evening wear", "natural fiber"],
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Organic Cotton Voile",
      category: "Cotton",
      subcategory: "Voile",
      price: 18.50,
      compareAt: null,
      stock: 50,
      sold: 0,
      desc: "Lightweight, breathable organic cotton voile. GOTS certified. Ideal for summer dresses, blouses, and baby garments.",
      material: "100% Organic Cotton",
      dimensions: "58 inches wide, sold by the yard",
      careInstructions: "Machine wash cold, tumble dry low",
      image: null,
      images: [],
      featured: true,
      tags: ["organic", "cotton", "breathable", "GOTS"],
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Belgian Linen Fabric",
      category: "Linen",
      subcategory: "Medium Weight",
      price: 32.00,
      compareAt: 42.00,
      stock: 36,
      sold: 0,
      desc: "Authentic Belgian linen with beautiful natural slubs. Gets softer with each wash. Perfect for shirts, pants, and home decor.",
      material: "100% European Linen",
      dimensions: "55 inches wide, sold by the yard",
      careInstructions: "Machine wash warm, iron while damp for best results",
      image: null,
      images: [],
      featured: false,
      tags: ["linen", "belgian", "natural", "breathable"],
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Merino Wool Tweed",
      category: "Wool",
      subcategory: "Tweed",
      price: 58.00,
      compareAt: null,
      stock: 18,
      sold: 0,
      desc: "Classic Scottish-style tweed woven from fine merino wool. Warm, durable, and timeless. Excellent for jackets, coats, and accessories.",
      material: "100% Merino Wool",
      dimensions: "60 inches wide, sold by the yard",
      careInstructions: "Dry clean recommended",
      image: null,
      images: [],
      featured: false,
      tags: ["wool", "tweed", "merino", "winter"],
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Hand-Embroidered Floral Silk",
      category: "Embroidered",
      subcategory: "Floral",
      price: 85.00,
      compareAt: 120.00,
      stock: 12,
      sold: 0,
      desc: "Exquisite hand-embroidered silk fabric featuring delicate floral motifs. Each piece is unique. Perfect for special occasion garments.",
      material: "Silk base with cotton embroidery thread",
      dimensions: "44 inches wide, sold by the yard",
      careInstructions: "Dry clean only",
      image: null,
      images: [],
      featured: true,
      tags: ["embroidered", "handmade", "floral", "luxury"],
      createdAt: Date.now() - 86400000,
    },
  ],
  orders: [],
  reviews: [],
  wishlists: {},
  carts: { guest: [] },
});
