/* ------------------------------------------------------------------ */
/*  Firebase Firestore Service Layer — Viora Textile Marketplace       */
/*  Proper collection-based architecture with targeted reads/writes    */
/* ------------------------------------------------------------------ */

import type { 
  User, Product, Order, Review, CartLine, Address, SellerProfile, OrderStatus 
} from "./data";

let db: import("firebase/firestore").Firestore | null = null;
let auth: import("firebase/auth").Auth | null = null;

/** Initialize Firestore and Auth instances */
export function initializeFirestore(firestoreInstance: import("firebase/firestore").Firestore) {
  db = firestoreInstance;
}

export function initializeAuth(authInstance: import("firebase/auth").Auth) {
  auth = authInstance;
}

export function getFirestore() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export function getAuth() {
  if (!auth) throw new Error("Auth not initialized");
  return auth;
}

/* ==================== COLLECTION PATHS ==================== */
export const COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  ORDERS: "orders",
  REVIEWS: "reviews",
  CARTS: "carts",
  WISHLISTS: "wishlists",
  SETTINGS: "settings",
} as const;

/* ==================== USER OPERATIONS ==================== */
export async function createUser(user: User): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const userRef = doc(fs, COLLECTIONS.USERS, user.id);
  await setDoc(userRef, {
    ...user,
    createdAt: user.joined,
    updatedAt: Date.now(),
  });
}

export async function updateUser(userId: string, patch: Partial<User>): Promise<void> {
  const fs = getFirestore();
  const { doc, updateDoc } = await import("firebase/firestore");
  const userRef = doc(fs, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function getUser(userId: string): Promise<User | null> {
  const fs = getFirestore();
  const { doc, getDoc } = await import("firebase/firestore");
  const userRef = doc(fs, COLLECTIONS.USERS, userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, joined: data.createdAt } as User;
}

export async function getAllUsers(): Promise<User[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
  const q = query(collection(fs, COLLECTIONS.USERS), orderBy("createdAt"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), joined: doc.data().createdAt } as User));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.USERS),
    where("email", "==", email.toLowerCase()),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return { ...data, joined: data.createdAt } as User;
}

/* ==================== PRODUCT OPERATIONS ==================== */
export async function createProduct(product: Product): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const productRef = doc(fs, COLLECTIONS.PRODUCTS, product.id);
  await setDoc(productRef, {
    ...product,
    createdAt: product.createdAt,
    updatedAt: Date.now(),
  });
}

export async function updateProduct(productId: string, patch: Partial<Product>): Promise<void> {
  const fs = getFirestore();
  const { doc, updateDoc } = await import("firebase/firestore");
  const productRef = doc(fs, COLLECTIONS.PRODUCTS, productId);
  await updateDoc(productRef, {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  const fs = getFirestore();
  const { doc, deleteDoc } = await import("firebase/firestore");
  const productRef = doc(fs, COLLECTIONS.PRODUCTS, productId);
  await deleteDoc(productRef);
}

export async function getProduct(productId: string): Promise<Product | null> {
  const fs = getFirestore();
  const { doc, getDoc } = await import("firebase/firestore");
  const productRef = doc(fs, COLLECTIONS.PRODUCTS, productId);
  const snap = await getDoc(productRef);
  if (!snap.exists()) return null;
  return snap.data() as Product;
}

export async function getProductsBySeller(sellerId: string, limitCount = 50): Promise<Product[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.PRODUCTS),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Product);
}

export async function getFeaturedProducts(limitCount = 20): Promise<Product[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.PRODUCTS),
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Product);
}

export async function getProductsByCategory(category: string, limitCount = 50): Promise<Product[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.PRODUCTS),
    where("category", "==", category),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Product);
}

export async function getAllProducts(limitCount = 100): Promise<Product[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.PRODUCTS),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Product);
}

/* ==================== ORDER OPERATIONS ==================== */
export async function createOrder(order: Order): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const orderRef = doc(fs, COLLECTIONS.ORDERS, order.id);
  await setDoc(orderRef, {
    ...order,
    createdAt: order.placedAt,
    updatedAt: Date.now(),
  });
}

export async function updateOrder(orderId: string, patch: Partial<Order>): Promise<void> {
  const fs = getFirestore();
  const { doc, updateDoc } = await import("firebase/firestore");
  const orderRef = doc(fs, COLLECTIONS.ORDERS, orderId);
  await updateDoc(orderRef, {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const fs = getFirestore();
  const { doc, getDoc } = await import("firebase/firestore");
  const orderRef = doc(fs, COLLECTIONS.ORDERS, orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return null;
  return snap.data() as Order;
}

export async function getOrdersByBuyer(buyerId: string, limitCount = 50): Promise<Order[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.ORDERS),
    where("buyerId", "==", buyerId),
    orderBy("placedAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Order);
}

export async function getOrdersBySeller(sellerId: string, limitCount = 100): Promise<Order[]> {
  const fs = getFirestore();
  const { collection, getDocs } = await import("firebase/firestore");
  // Note: This requires a composite index on items.sellerId + placedAt
  // For now, fetch all and filter client-side for simplicity
  const snapshot = await getDocs(collection(fs, COLLECTIONS.ORDERS));
  const orders = snapshot.docs.map(doc => doc.data() as Order);
  return orders
    .filter(order => order.items.some(item => item.sellerId === sellerId))
    .sort((a, b) => b.placedAt - a.placedAt)
    .slice(0, limitCount);
}

export async function getAllOrders(limitCount = 100): Promise<Order[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.ORDERS),
    orderBy("placedAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Order);
}

/* ==================== REVIEW OPERATIONS ==================== */
export async function createReview(review: Review): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const reviewRef = doc(fs, COLLECTIONS.REVIEWS, review.id);
  await setDoc(reviewRef, {
    ...review,
    createdAt: review.at,
  });
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.REVIEWS),
    where("productId", "==", productId),
    orderBy("at", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Review);
}

export async function getUserReviewForProduct(userId: string, productId: string): Promise<Review | null> {
  const fs = getFirestore();
  const { collection, getDocs, query, where, limit } = await import("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.REVIEWS),
    where("userId", "==", userId),
    where("productId", "==", productId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Review;
}

/* ==================== CART OPERATIONS ==================== */
export async function updateCart(userId: string, cartItems: CartLine[]): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const cartRef = doc(fs, COLLECTIONS.CARTS, userId);
  await setDoc(cartRef, {
    items: cartItems,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function getCart(userId: string): Promise<CartLine[]> {
  const fs = getFirestore();
  const { doc, getDoc } = await import("firebase/firestore");
  const cartRef = doc(fs, COLLECTIONS.CARTS, userId);
  const snap = await getDoc(cartRef);
  if (!snap.exists()) return [];
  const data = snap.data();
  return (data.items || []) as CartLine[];
}

/* ==================== WISHLIST OPERATIONS ==================== */
export async function updateWishlist(userId: string, productIds: string[]): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const wishlistRef = doc(fs, COLLECTIONS.WISHLISTS, userId);
  await setDoc(wishlistRef, {
    productIds,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function getWishlist(userId: string): Promise<string[]> {
  const fs = getFirestore();
  const { doc, getDoc } = await import("firebase/firestore");
  const wishlistRef = doc(fs, COLLECTIONS.WISHLISTS, userId);
  const snap = await getDoc(wishlistRef);
  if (!snap.exists()) return [];
  const data = snap.data();
  return (data.productIds || []) as string[];
}

/* ==================== SETTINGS OPERATIONS ==================== */
export async function updateSettings(settings: {
  commission: number;
  announcement: string;
  shippingRates: { region: string; rate: number }[];
  currency: string;
}): Promise<void> {
  const fs = getFirestore();
  const { doc, setDoc } = await import("firebase/firestore");
  const settingsRef = doc(fs, COLLECTIONS.SETTINGS, "market");
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: Date.now(),
  });
}

export async function getSettings(): Promise<{
  commission: number;
  announcement: string;
  shippingRates: { region: string; rate: number }[];
  currency: string;
} | null> {
  const fs = getFirestore();
  const { doc, getDoc } = await import("firebase/firestore");
  const settingsRef = doc(fs, COLLECTIONS.SETTINGS, "market");
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) return null;
  return snap.data() as any;
}

/* ==================== TRANSACTION HELPERS ==================== */
/**
 * Execute a transaction to atomically update stock and create an order.
 * This prevents race conditions when multiple users try to buy the last item.
 */
export async function createOrderWithStockCheck(
  order: Order,
  productIds: string[]
): Promise<boolean> {
  const fs = getFirestore();
  const { runTransaction, doc, getDoc, updateDoc } = await import("firebase/firestore");
  
  try {
    await runTransaction(fs, async (transaction) => {
      // Verify stock for each product
      for (const productId of productIds) {
        const productRef = doc(fs, COLLECTIONS.PRODUCTS, productId);
        const productSnap = await getDoc(transaction, productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`Product ${productId} not found`);
        }
        
        const product = productSnap.data() as Product;
        const orderItem = order.items.find(item => item.productId === productId);
        
        if (!orderItem) continue;
        
        if (product.stock < orderItem.qty) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        
        // Decrement stock
        transaction.update(productRef, {
          stock: product.stock - orderItem.qty,
          sold: (product.sold || 0) + orderItem.qty,
          updatedAt: Date.now(),
        });
      }
      
      // Create the order
      const orderRef = doc(fs, COLLECTIONS.ORDERS, order.id);
      transaction.set(orderRef, {
        ...order,
        createdAt: order.placedAt,
        updatedAt: Date.now(),
      });
    });
    
    return true;
  } catch (error) {
    console.error("Transaction failed:", error);
    return false;
  }
}

/* ==================== REAL-TIME LISTENERS ==================== */
export type UnsubscribeFn = () => void;

export function listenToCart(
  userId: string,
  callback: (cart: CartLine[]) => void
): UnsubscribeFn {
  const fs = getFirestore();
  const { doc, onSnapshot } = require("firebase/firestore");
  const cartRef = doc(fs, COLLECTIONS.CARTS, userId);
  
  const unsubscribe = onSnapshot(cartRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.data();
    callback((data.items || []) as CartLine[]);
  });
  
  return unsubscribe;
}

export function listenToWishlist(
  userId: string,
  callback: (productIds: string[]) => void
): UnsubscribeFn {
  const fs = getFirestore();
  const { doc, onSnapshot } = require("firebase/firestore");
  const wishlistRef = doc(fs, COLLECTIONS.WISHLISTS, userId);
  
  const unsubscribe = onSnapshot(wishlistRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.data();
    callback((data.productIds || []) as string[]);
  });
  
  return unsubscribe;
}

export function listenToOrdersByBuyer(
  buyerId: string,
  callback: (orders: Order[]) => void
): UnsubscribeFn {
  const fs = getFirestore();
  const { collection, query, where, orderBy, onSnapshot } = require("firebase/firestore");
  const q = query(
    collection(fs, COLLECTIONS.ORDERS),
    where("buyerId", "==", buyerId),
    orderBy("placedAt", "desc")
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => doc.data() as Order);
    callback(orders);
  });
  
  return unsubscribe;
}
