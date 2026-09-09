/* ---------- domain types ---------- */
export type Role = "buyer" | "seller" | "admin";

/**
 * Sri Lankan address format with district and province
 */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  district: string;      // e.g., Colombo, Kandy, Galle
  province: string;      // e.g., Western, Central, Southern
  postalCode: string;    // Sri Lankan postal code (5 digits)
  country: string;       // Default: "Sri Lanka"
  phone: string;         // Required for delivery
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
 * Sri Lankan provinces for address selection
 */
export const SRI_LANKA_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
] as const;

/**
 * Major districts in Sri Lanka
 */
export const SRI_LANKA_DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara",           // Western
  "Kandy", "Matale", "Nuwara Eliya",          // Central
  "Galle", "Matara", "Hambantota",            // Southern
  "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu",  // Northern
  "Batticaloa", "Ampara", "Trincomalee",      // Eastern
  "Kurunegala", "Puttalam",                    // North Western
  "Anuradhapura", "Polonnaruwa",              // North Central
  "Badulla", "Monaragala",                     // Uva
  "Kegalle", "Ratnapura",                      // Sabaragamuwa
] as const;

/**
 * Validate Sri Lankan phone number format
 * Accepts: +94XXXXXXXXX, 07XXXXXXXX, 94XXXXXXXXX
 */
export const validateSriLankaPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  // Match +94 or 94 followed by 9 digits, or 07 followed by 8 digits
  const regex = /^(\+94|94)7[0-9]{8}$|^07[0-9]{8}$/;
  return regex.test(cleaned);
};

/**
 * Format phone number to standard Sri Lankan format (+94 XXX XXX XXXX)
 */
export const formatSriLankaPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  if (cleaned.startsWith("+94")) {
    const num = cleaned.slice(3);
    return `+94 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
  }
  
  if (cleaned.startsWith("94")) {
    const num = cleaned.slice(2);
    return `+94 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
  }
  
  if (cleaned.startsWith("07")) {
    const num = cleaned.slice(1);
    return `+94 ${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
  }
  
  return phone;
};

/**
 * Validate Sri Lankan postal code (5 digits)
 */
export const validatePostalCode = (code: string): boolean => {
  return /^\d{5}$/.test(code);
};

/**
 * Create empty address object with Sri Lankan defaults
 */
export const createEmptyAddress = (): Address => ({
  line1: "",
  line2: "",
  city: "",
  district: "",
  province: "",
  postalCode: "",
  country: "Sri Lanka",
  phone: "",
});

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
  address: Address | null;  // Can be null until user adds it
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

/**
 * Format currency for Sri Lankan Rupees (LKR)
 * Displays as: Rs. 1,990 or Rs. 12,500
 */
export const money = (n: number) => {
  const currency = import.meta.env.VITE_APP_CURRENCY || "LKR";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
};

/**
 * Get the app's configured currency code
 */
export const getCurrency = () => import.meta.env.VITE_APP_CURRENCY || "LKR";

/**
 * Get the app's configured country code
 */
export const getCountry = () => import.meta.env.VITE_APP_COUNTRY || "LK";

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
    announcement: "Welcome to Viora — Your destination for premium textiles and fabrics in Sri Lanka.",
    shippingRates: [
      { region: "Western Province", rate: 450 },
      { region: "Central Province", rate: 650 },
      { region: "Southern Province", rate: 750 },
      { region: "Northern Province", rate: 950 },
      { region: "Eastern Province", rate: 850 },
      { region: "North Western", rate: 700 },
      { region: "North Central", rate: 800 },
      { region: "Uva Province", rate: 850 },
      { region: "Sabaragamuwa", rate: 700 },
    ],
    currency: "LKR",
  },
  users: [],
  products: [
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Pure Mulberry Silk Fabric",
      category: "Silk",
      subcategory: "Plain Weave",
      price: 6500,
      compareAt: 9500,
      stock: 24,
      sold: 0,
      desc: "Luxurious 100% pure mulberry silk fabric with a smooth, lustrous finish. Perfect for evening wear, sarees, and luxury linings. Weight: 16 momme.",
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
      price: 2800,
      compareAt: null,
      stock: 50,
      sold: 0,
      desc: "Lightweight, breathable organic cotton voile. GOTS certified. Ideal for summer dresses, kurtas, and baby garments.",
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
      price: 4800,
      compareAt: 6200,
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
      price: 8500,
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
      price: 12500,
      compareAt: 18000,
      stock: 12,
      sold: 0,
      desc: "Exquisite hand-embroidered silk fabric featuring delicate floral motifs. Each piece is unique. Perfect for special occasion garments and bridal wear.",
      material: "Silk base with cotton embroidery thread",
      dimensions: "44 inches wide, sold by the yard",
      careInstructions: "Dry clean only",
      image: null,
      images: [],
      featured: true,
      tags: ["embroidered", "handmade", "floral", "luxury", "bridal"],
      createdAt: Date.now() - 86400000,
    },
    {
      id: uid("prod"),
      sellerId: "admin",
      name: "Traditional Batik Print Cotton",
      category: "Printed",
      subcategory: "Batik",
      price: 3200,
      compareAt: 4500,
      stock: 40,
      sold: 0,
      desc: "Authentic Sri Lankan batik print on soft cotton. Traditional designs created using wax-resist dyeing technique. Perfect for casual wear and home decor.",
      material: "100% Cotton with batik print",
      dimensions: "45 inches wide, sold by the yard",
      careInstructions: "Hand wash cold separately, line dry",
      image: null,
      images: [],
      featured: true,
      tags: ["batik", "printed", "traditional", "Sri Lankan"],
      createdAt: Date.now() - 86400000 * 6,
    },
  ],
  orders: [],
  reviews: [],
  wishlists: {},
  carts: { guest: [] },
});
