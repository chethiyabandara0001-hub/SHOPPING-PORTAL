# Viora Textile Marketplace - Deployment Guide

## Overview
Viora is a Sri Lankan textile e-commerce marketplace built with React, TypeScript, Vite, and Firebase. It features proper Firestore collection-based architecture with security rules.

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (already set up: `kiosk-shopping-ad738`)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAISVtyphO1eRggAcoEJRjIA-Ow2TZqsAQ
VITE_FIREBASE_AUTH_DOMAIN=kiosk-shopping-ad738.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kiosk-shopping-ad738
VITE_FIREBASE_STORAGE_BUCKET=kiosk-shopping-ad738.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=926649050387
VITE_FIREBASE_APP_ID=1:926649050387:web:a197d416c328c7acc366e6
VITE_FIREBASE_MEASUREMENT_ID=G-45CQX9ZGLL

# App Settings
VITE_APP_NAME=Viora
VITE_APP_CURRENCY=LKR
VITE_APP_COUNTRY=LK
```

## Firebase Setup

### 1. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Or manually copy the contents of `firestore.rules` to your Firebase Console:
- Go to Firebase Console → Firestore Database → Rules
- Paste the rules from `firestore.rules`
- Publish

### 2. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

Or manually create indexes in Firebase Console:
- Go to Firebase Console → Firestore Database → Indexes
- Create the composite indexes listed in `firestore.indexes.json`

### 3. Required Firestore Collections Structure

The app uses these collections:
- `users/{userId}` - User profiles
- `products/{productId}` - Product listings
- `orders/{orderId}` - Order records
- `reviews/{reviewId}` - Product reviews
- `carts/{userId}` - Shopping carts (per user)
- `wishlists/{userId}` - Wishlists (per user)
- `settings/market` - Market settings

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Vercel

1. **Connect GitHub Repository**
   - Push your code to GitHub
   - Connect repository to Vercel

2. **Set Environment Variables in Vercel**
   Add all the environment variables from `.env.example` in Vercel project settings

3. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   ```bash
   vercel deploy --prod
   ```

## Key Features Implemented

### Sri Lanka Localization
- Currency: LKR (Rs.)
- Address format: District, Province, Postal Code
- Phone validation: +94 format
- Shipping rates by province

### Security
- Firestore Security Rules enforce all permissions
- No client-side privilege escalation possible
- Product ownership verification
- Order access control (buyers see their orders, sellers see relevant orders)

### Performance Optimizations
- Collection-based queries instead of full DB downloads
- Pagination on large lists
- Targeted reads/writes
- Lazy-loaded Firebase SDK

### Architecture Changes
- ✅ Replaced single-document DB with proper collections
- ✅ Per-user cart and wishlist documents
- ✅ Transaction-based order creation with stock verification
- ✅ Removed unused dependencies (Supabase, date-fns, uuid)

## Admin Setup

The first user to sign up becomes the admin automatically. Admin can:
- Manage all users (block, change roles)
- Feature/unfeature products
- Manage market settings
- View all orders

## Testing Checklist

- [ ] Sign up as first user (becomes admin)
- [ ] Add products as admin/seller
- [ ] Sign up as second user (buyer)
- [ ] Add items to cart
- [ ] Add shipping address
- [ ] Place order
- [ ] Verify order appears for buyer
- [ ] Verify order appears for admin/seller
- [ ] Update order status
- [ ] Test product editing/deletion permissions
- [ ] Test unauthorized access attempts

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Firestore Permission Denied
- Ensure security rules are deployed
- Check that user is authenticated
- Verify user role in Firestore

### Missing Indexes
- Check browser console for index creation links
- Or deploy indexes using `firebase deploy --only firestore:indexes`

## Support

For issues related to:
- Firebase: Check Firebase Console logs
- Build errors: Run `npm run typecheck` first
- Deployment: Check Vercel deployment logs
