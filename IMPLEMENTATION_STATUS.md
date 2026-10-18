# Implementation Status & Backend Architecture Audit

**Project:** Vélure Atelier — Premium Clothing E-Commerce & Brand SaaS  
**Audit Date:** 18 October 2026  
**Status:** Frontend Complete (Production Build Verified) • Backend & Database Integration Pending  
**Next.js Version:** 14.2.24 (App Router)  

---

## 1. Existing Architecture & Technology Stack

### 1.1 Core Framework & Runtime
- **Next.js 14.2.24 (App Router):** Using standard App Router conventions with React Server Components (RSC) and Client Components (`"use client"`).
- **React 18.3.1 / React DOM 18.3.1:** Strict Mode enabled.
- **TypeScript 5.6.3:** Configured with `strict: true`, `target: es5`, `moduleResolution: bundler`. `npm run typecheck` passes with zero errors.
- **Styling & UI Tokens:** 
  - Tailwind CSS 3.4.14 with design tokens defined in `tailwind.config.ts` matching the Stitch AI design specification (`atelier_commerce/DESIGN.md`).
  - Warm editorial color palette: Dark Walnut (`#582F0E`), Saddle Brown (`#7F4F24`), Warm Ivory (`#FAF7F2`), Deep Charcoal (`#24201D`).
  - Typography scale: Plus Jakarta Sans hierarchy (`display-lg`, `headline-lg`, `title-md`, `body-lg`, `label-sm`).
  - Autoprefixer 10.4.20, PostCSS 8.4.47.
  - Lucide React 0.453.0 for iconography.
  - Class merge utilities: `clsx` 2.1.1 and `tailwind-merge` 2.5.4 in `src/lib/utils.ts`.
- **Forms & Client Validation:**
  - React Hook Form 7.53.0.
  - Zod 3.23.8 for schema definitions.
  - `@hookform/resolvers` 3.9.0.

### 1.2 State Management & Client Persistence
- **React Context:**
  - `CartContext.tsx` (`src/context/CartContext.tsx`): Manages cart items, quantities, coupon codes, and shipping calculations.
  - `WishlistContext.tsx` (`src/context/WishlistContext.tsx`): Manages customer saved pieces and move-to-bag operations.
- **Browser Persistence:**
  - `localStorage`: Used for client-side persistence of cart items (`velure_cart_items_v1`), coupon codes (`velure_coupon_code_v1`), and wishlist (`velure_wishlist_items_v1`) via SSR-safe helper utilities in `src/lib/utils.ts`.
  - `sessionStorage`: Used for order confirmation handoff (`velure_latest_order`) between `/checkout` and `/order-confirmation`.

### 1.3 Routing and Rendering Strategy
- **Prerendered Static Content (SSG):**
  - `/` (Homepage)
  - `/shop` (Shop All catalog with client-side query string synchronization)
  - `/collections` (Collections directory)
  - `/collections/[slug]` (Static generation with `generateStaticParams` for 4 capsules)
  - `/products/[slug]` (Static generation with `generateStaticParams` for 13 apparel items)
  - `/cart`, `/checkout`, `/wishlist`, `/search`, `/order-confirmation`, `/about`, `/contact`
- **Dynamic Route Handlers (Server-Side Endpoints, `force-dynamic`):**
  - `/api/products` (GET: catalog listing, multi-field search, category & attribute filtering, dynamic price/fabric facets)
  - `/api/products/[slug]` (GET: single garment by slug, related silhouettes)
  - `/api/collections` (GET: all collections with dynamic product counts)
  - `/api/collections/[slug]` (GET: single collection with linked products)
  - `/api/checkout` (POST: server-side stock validation and order summary generation)

### 1.4 Data Layer Abstraction
- **Local Fixture Layer:** `src/data/products.ts` (13 apparel silhouettes with colors, sizes, SKUs, inventory counts, fabric origins, and weave specifications) and `src/data/collections.ts` (4 curated chapters).
- **Service Layer:** `src/services/productService.ts` encapsulates all catalog operations as asynchronous `Promise`-based functions (`getProducts`, `getProductBySlug`, `getProductById`, `getBestsellers`, `getNewArrivals`, `getRelatedProducts`, `getCollections`, `getCollectionBySlug`, `getFilterFacets`, `validateStock`, `checkPincodeDelivery`).
- **Database Client Stub:** `src/lib/supabase.ts` contains conditional `@supabase/supabase-js` initialization. When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, it gracefully falls back to local data.

### 1.5 Image Handling & CDN Remote Patterns
- Standardized Next.js `<Image />` component with responsive `sizes`, `priority` loading for above-the-fold content, and `object-fit: cover`.
- Image domains configured in `next.config.mjs`: `images.unsplash.com`, `images.pexels.com`, and `lh3.googleusercontent.com`.
- Every image in the catalog depicts genuine wearable apparel garments (dresses, jackets, blazers, tunics, trousers, knitwear). Zero accessories, bags, cosmetics, or placeholder graphics.
- Image components include `onError` fallback handlers to protect against broken CDN links.

---

## 2. Completed Frontend Features

| Page / Component | Route / Location | Functional Capabilities Completed |
|---|---|---|
| **Global Layout** | `src/app/layout.tsx` | Root layout, metadata, Plus Jakarta Sans font, Cart & Wishlist provider wrapping, Cart Drawer mount |
| **Announcement Bar** | `src/components/layout/AnnouncementBar.tsx` | Rotating notices, promo announcements, complimentary shipping thresholds |
| **Sticky Header** | `src/components/layout/Header.tsx` | Wordmark logo, category navigation links, search trigger, dynamic wishlist count, cart counter badge, mobile navigation drawer |
| **Footer** | `src/components/layout/Footer.tsx` | Newsletter signup, curated links, brand story, payment icons, copyright notice |
| **Editorial Homepage** | `src/app/page.tsx` | Full-bleed hero banner, featured collections mosaic, bestsellers carousel with loading skeleton, manifesto split-view, countdown drop timer, testimonials, newsletter form |
| **Catalog & Shop All** | `src/app/shop/ShopClient.tsx` | Faceted sidebar (categories, swatches, sizes, fabrics, weaves, price slider), sorting, 3 vs 4 column layout toggle, mobile filter drawer, pagination / load-more progress bar |
| **Product Details (PDP)** | `src/app/products/[slug]/ProductDetailClient.tsx` | Multi-image gallery with role labels, thumbnail selector, full-screen lightbox zoom, dynamic size/color swatches, stock urgency status chips (`Sold Out`, `Low Batch`, `In Stock`), Indian PIN code delivery estimator, three-tier accordion (textile specs, fit, shipping), related garments |
| **Cart Drawer** | `src/components/cart/CartDrawer.tsx` | Slide-out overlay, quantity controls, coupon code validation (`FESTIVE10`, `WELCOME15`, `ATELIER20`), free shipping progress bar, one-click paired garment add |
| **Cart Page** | `src/app/cart/page.tsx` | Full-page cart management, order breakdown, trust badges, delivery timeline |
| **Checkout Flow** | `src/app/checkout/page.tsx` | Two-column responsive layout, Zod schema validation (Indian PIN code, 10-digit mobile, address), payment method radio group (UPI, Cards, Netbanking, COD), order summary sidebar |
| **Order Confirmation** | `src/app/order-confirmation/page.tsx` | Order summary display, 4-step fulfillment tracker, shipping address verification, printable invoice button |
| **Wishlist** | `src/app/wishlist/page.tsx` | Saved garments grid, move-to-bag action, removal, empty state |
| **Search** | `src/app/search/SearchClient.tsx` | Live search input with debounced query matching across titles, fabrics, colors, and categories |
| **Collections** | `src/app/collections/`, `[slug]` | Collections index and dedicated capsule pages with dynamic item counts |
| **Story & Contact** | `src/app/about/`, `src/app/contact/` | Brand manifesto, sustainability pillars, concierge contact form, FAQ accordion |

---

## 3. Missing Backend and Integrations

While the customer-facing frontend is complete and interactive, it currently relies on client-side state, local storage, and in-memory mock fixtures. The following backend services and integrations are missing:

### 3.1 Database & Multi-Tenant Persistence
- **No Active Database:** The application is not connected to a live database. Supabase configuration is stubbed out.
- **Missing Tables & Schemas:** No PostgreSQL tables exist for tenants, users, products, variants, inventory, orders, customers, or discounts.
- **No Row Level Security (RLS):** Database policies enforcing multi-tenant isolation have not been deployed.
- **Static Catalog Data:** Product listings and inventory levels reside in static files (`src/data/products.ts`), meaning updates cannot be made without a code redeployment.

### 3.2 Authentication & User Management
- **No Authentication Routes:** There are no sign-in (`/login`), sign-up (`/register`), password reset, or session callback endpoints.
- **No User Context or RBAC:** Roles (`platform_admin`, `tenant_owner`, `tenant_staff`, `customer`) are not defined or enforced.
- **No Middleware Session Protection:** Next.js `middleware.ts` is missing; authenticated routes cannot be protected, and expired tokens cannot be refreshed.
- **No Customer Accounts:** Customers cannot save addresses, view past orders, or re-order from previous purchases.

### 3.3 Merchant Admin Dashboard
- **No Administrative Interface:** There is no dashboard (`/admin` or `/dashboard`) for business owners or staff.
- **Missing Administrative Capabilities:**
  - Product Catalog Management (CRUD operations for garments, variants, SKUs, and pricing).
  - Inventory Management (viewing stock levels, recording stock adjustments, managing low-stock thresholds).
  - Order Fulfillment Management (updating order states: `pending` → `confirmed` → `tailoring` → `dispatched` → `delivered`).
  - Social / Manual Order Entry (capturing orders received via WhatsApp, Instagram DM, or phone).
  - Customer Management (customer profiles, purchase history, lifetime value).
  - Discount Management (creating promo codes with usage limits, date ranges, and percentage/fixed rules).
  - Business Settings (configuring brand details, tax rates, shipping rates, and payment methods).

### 3.4 Payment Gateway & Transaction Processing
- **Simulated Payment:** Checkout currently simulates payment completion via a client-side timer.
- **No Payment Gateway SDK:** Neither Razorpay, Cashfree, nor Stripe is integrated.
- **Missing Payment Endpoints:**
  - Order creation endpoint to obtain payment tokens / order IDs from the gateway.
  - Webhook receiver (e.g., `/api/webhooks/razorpay`) with cryptographic signature verification to handle asynchronous payment success/failure.
  - Refund processing endpoint.

### 3.5 Transactional Inventory Ledger & Stock Reservation
- **No Atomic Stock Decrements:** In-memory stock validation cannot prevent race conditions or double-selling under concurrent checkouts.
- **No Reservation Mechanism:** Stock is not held temporarily during the customer's checkout/payment window.
- **No Inventory Ledger:** Movements are not audited with reason codes (`sale`, `restock`, `damage`, `return`, `cancellation`).

### 3.6 Media Asset Storage
- **No File Upload Backend:** Garment photos cannot be uploaded through an API or dashboard.
- **Missing Supabase Storage Buckets:** Buckets for product photography and brand assets are not created or secured with access policies.

### 3.7 Transactional Notifications
- **No Email Dispatch:** Order confirmation emails, invoices, and tracking links are not sent (no Resend/SendGrid integration).
- **No WhatsApp/SMS Dispatch:** Shipping alerts via SMS or WhatsApp (standard for Indian D2C brands) are not configured.

---

## 4. Existing Code That Can Be Reused

The existing codebase was built cleanly with strong separation of concerns, providing high reuse potential:

1. **Type Definitions (`src/types/index.ts`):**
   - Types (`Product`, `ProductVariant`, `ProductColor`, `ProductImage`, `Collection`, `CartItem`, `CustomerCheckoutDetails`, `OrderSummary`) directly align with the planned relational schema.
   - Reusable across server actions, API routes, and database serialization layers.

2. **Service Layer Abstraction (`src/services/productService.ts`):**
   - Public function signatures (`getProducts`, `getProductBySlug`, `getProductById`, `getBestsellers`, `getNewArrivals`, `getRelatedProducts`, `getCollections`, `getCollectionBySlug`, `getFilterFacets`, `validateStock`, `checkPincodeDelivery`) are already asynchronous.
   - The internals can be swapped to query Supabase tables directly without requiring changes to any page or UI component.

3. **API Route Handlers (`src/app/api/`):**
   - `/api/products/route.ts` already handles multi-parameter query filtering and facet generation.
   - `/api/products/[slug]/route.ts` already provides single product and related items serialization.
   - `/api/collections/route.ts` and `/api/collections/[slug]/route.ts` are ready for database queries.
   - `/api/checkout/route.ts` already outlines the order payload contract and stock validation response schema.

4. **Client State Contexts (`src/context/`):**
   - `CartContext.tsx` and `WishlistContext.tsx` can continue managing client-side cart items and optimistic UI updates, while syncing with backend cart/order endpoints when authenticated.

5. **Validation Schemas:**
   - Zod `checkoutSchema` in `src/app/checkout/page.tsx` can be extracted to a shared validation file (`src/lib/validations/order.ts`) and reused on the server inside `/api/checkout` or server actions to prevent duplicate logic.

6. **Utility Functions (`src/lib/utils.ts`):**
   - `formatPrice`, `isValidPincode`, `generateOrderNumber`, and `cn` are pure functions ready for immediate server/client reuse.

---

## 5. Proposed Database Entities & Relationships

Based on `Docs/DatabaseSchema.md`, the platform is designed around a multi-tenant relational schema:

```mermaid
erDiagram
    TENANTS ||--o{ TENANT_MEMBERSHIPS : has
    USERS ||--o{ TENANT_MEMBERSHIPS : belongs_to
    TENANTS ||--|| BUSINESS_SETTINGS : configures
    TENANTS ||--o{ CATEGORIES : defines
    TENANTS ||--o{ COLLECTIONS : defines
    TENANTS ||--o{ PRODUCTS : owns
    PRODUCTS ||--o{ PRODUCT_VARIANTS : contains
    PRODUCTS }o--o{ COLLECTIONS : belongs_to
    PRODUCT_VARIANTS ||--|| INVENTORY_ITEMS : tracks
    PRODUCT_VARIANTS ||--o{ INVENTORY_MOVEMENTS : records
    PRODUCT_VARIANTS ||--o{ INVENTORY_RESERVATIONS : holds
    TENANTS ||--o{ CUSTOMERS : manages
    CUSTOMERS ||--o{ CUSTOMER_ADDRESSES : has
    TENANTS ||--o{ ORDERS : receives
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o{ ORDER_STATUS_HISTORY : tracks
    ORDERS ||--o{ PAYMENTS : has
    PAYMENTS ||--o{ REFUNDS : generates
    TENANTS ||--o{ DISCOUNTS : creates
    TENANTS ||--o{ AUDIT_LOGS : records
```

### 5.1 Entity Specifications

1. **`tenants`**: Multi-tenant business workspace.
   - `id` (UUID, PK), `name` (TEXT), `slug` (TEXT, UNIQUE), `domain` (TEXT, UNIQUE, NULLABLE), `currency` (VARCHAR(3), default 'INR'), `created_at` (TIMESTAMPTZ).
2. **`business_settings`**: Tenant operational rules.
   - `id` (UUID, PK), `tenant_id` (UUID, FK), `support_email` (TEXT), `support_phone` (TEXT), `free_shipping_threshold` (NUMERIC), `default_shipping_fee` (NUMERIC), `tax_rate_percent` (NUMERIC), `cod_enabled` (BOOLEAN).
3. **`users` & `tenant_memberships`**: Identity and role authorization.
   - `users`: Managed via Supabase `auth.users`, mirrored in public profile (`id`, `email`, `full_name`).
   - `tenant_memberships`: `id`, `tenant_id` (FK), `user_id` (FK), `role` (`owner` | `staff` | `admin`), `created_at`.
4. **`products`**: Apparel garment root record.
   - `id` (UUID, PK), `tenant_id` (UUID, FK), `name` (TEXT), `slug` (TEXT), `subtitle` (TEXT), `description` (TEXT), `category_id` (UUID, FK), `fabric` (TEXT), `fabric_origin` (TEXT), `weave_technique` (TEXT), `gsm` (INTEGER), `edition` (TEXT), `badge` (TEXT), `base_price` (NUMERIC), `compare_at_price` (NUMERIC), `is_featured` (BOOLEAN), `is_bestseller` (BOOLEAN), `is_new_arrival` (BOOLEAN), `is_archived` (BOOLEAN).
5. **`product_variants`**: Size and color permutations.
   - `id` (UUID, PK), `product_id` (UUID, FK), `sku` (TEXT, UNIQUE), `size` (TEXT), `color_name` (TEXT), `color_hex` (TEXT), `price_override` (NUMERIC, NULLABLE).
6. **`product_images`**: Multi-angle garment photography.
   - `id` (UUID, PK), `product_id` (UUID, FK), `url` (TEXT), `alt_text` (TEXT), `label` (TEXT: `Front` | `Back` | `Detail` | `Lookbook`), `sort_order` (INTEGER).
7. **`inventory_items` & `inventory_movements`**: Real-time stock tracking and audit ledger.
   - `inventory_items`: `id`, `variant_id` (UUID, FK, UNIQUE), `quantity_on_hand` (INTEGER), `quantity_reserved` (INTEGER).
   - `inventory_movements`: `id`, `variant_id` (FK), `delta` (INTEGER), `movement_type` (`order_sale` | `restock` | `manual_adjustment` | `cancellation_return` | `damaged`), `reference_id` (TEXT), `created_at`.
8. **`inventory_reservations`**: Temporary holds during checkout.
   - `id`, `variant_id` (FK), `quantity` (INTEGER), `cart_session_id` (TEXT), `expires_at` (TIMESTAMPTZ).
9. **`customers` & `customer_addresses`**: Customer accounts and shipping profiles.
   - `customers`: `id`, `tenant_id` (FK), `full_name` (TEXT), `email` (TEXT), `phone` (TEXT).
   - `customer_addresses`: `id`, `customer_id` (FK), `address_line1`, `address_line2`, `city`, `state`, `pincode`, `is_default`.
10. **`orders` & `order_items`**: Order lifecycle and immutable line-item snapshot.
    - `orders`: `id`, `tenant_id` (FK), `order_number` (TEXT, UNIQUE), `customer_id` (FK), `channel` (`storefront` | `instagram` | `whatsapp` | `phone`), `subtotal` (NUMERIC), `shipping_fee` (NUMERIC), `discount_amount` (NUMERIC), `tax_amount` (NUMERIC), `total_amount` (NUMERIC), `payment_method` (`upi` | `card` | `netbanking` | `cod`), `payment_status` (`pending` | `paid` | `failed` | `refunded`), `fulfillment_status` (`confirmed` | `tailoring` | `inspection` | `dispatched` | `delivered` | `cancelled`), `shipping_address` (JSONB), `tracking_number` (TEXT).
    - `order_items`: `id`, `order_id` (FK), `product_id` (FK), `variant_id` (FK), `product_name` (TEXT), `variant_description` (TEXT), `sku` (TEXT), `unit_price` (NUMERIC), `quantity` (INTEGER), `line_total` (NUMERIC).
11. **`discounts`**: Promotional campaign rules.
    - `id`, `tenant_id` (FK), `code` (TEXT), `discount_type` (`percentage` | `fixed_amount`), `value` (NUMERIC), `min_subtotal` (NUMERIC), `max_uses` (INTEGER), `used_count` (INTEGER), `starts_at` (TIMESTAMPTZ), `expires_at` (TIMESTAMPTZ), `is_active` (BOOLEAN).

---

## 6. Security Concerns & Missing Environment Configuration

### 6.1 Security Concerns
1. **Client-Side Pricing Trust:**
   - In the current frontend, order totals and discounts are calculated on the client side.
   - *Requirement:* The backend `/api/checkout` must re-fetch active product prices and calculate totals independently on the server to prevent malicious client tampering.
2. **Missing Row Level Security (RLS):**
   - Without RLS policies on Supabase tables, any authenticated client with an anon key could query or mutate data across all tenants.
   - *Requirement:* Every table must have RLS enabled, restricting access to records where `tenant_id` matches the user's active membership.
3. **Inventory Race Conditions (Overselling):**
   - Without atomic database transactions or row-level locking (`SELECT ... FOR UPDATE`), concurrent checkouts for limited-edition items (e.g., 2 units remaining) could result in overselling.
   - *Requirement:* Use PostgreSQL stored procedures or transactions to atomically reserve/decrement inventory.
4. **Secret Key Exposure Risk:**
   - Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`) must never be prefixed with `NEXT_PUBLIC_` or imported into client components.
5. **Webhook Signature Verification:**
   - Payment webhooks must cryptographically verify gateway signatures (e.g., Razorpay HMAC SHA256 or Stripe signature) before updating payment status or committing inventory.
6. **API Route Rate Limiting:**
   - Public endpoints like `/api/checkout` and `/api/products` require rate limiting to prevent denial-of-service and inventory-exhaustion attacks.

### 6.2 Missing Environment Configuration

Currently, there are no `.env*` files in the repository. The following variables must be configured in `.env.example` and `.env.local`:

```bash
# ==============================================================================
# Supabase Configuration
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-only (never expose to client)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# ==============================================================================
# Application URL & Environment
# ==============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ==============================================================================
# Payment Gateway (Razorpay / Stripe)
# ==============================================================================
# Razorpay Option:
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-razorpay-secret # Server-only
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret # Server-only

# Or Stripe Option:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# ==============================================================================
# Transactional Email (Resend / SendGrid)
# ==============================================================================
RESEND_API_KEY=re_... # Server-only
EMAIL_FROM=orders@velure-atelier.com
```

---

## 7. Dependencies Between Implementation Phases

```mermaid
flowchart TD
    P1["Phase 1: DB Schema & Migrations<br/>(Tables, Constraints, Indexes)"]
    P2["Phase 2: RLS Policies & Auth Setup<br/>(Supabase Auth, SSR Client, Roles)"]
    P3["Phase 3: Data-Access Service Layer<br/>(Connect productService to Supabase)"]
    P4["Phase 4: Transactional Inventory & Orders<br/>(Atomic reservations, checkout route)"]
    P5["Phase 5: Payment Gateway & Webhooks<br/>(Razorpay/Stripe, signature checks)"]
    P6["Phase 6: Admin Dashboard<br/>(Catalog, stock, orders, discounts)"]
    P7["Phase 7: Notifications & Storage<br/>(Image upload, transactional email)"]

    P1 --> P2
    P2 --> P3
    P2 --> P6
    P3 --> P4
    P4 --> P5
    P4 --> P6
    P5 --> P7
```

- **Phase 1 (Database Schema)** is the hard blocker for all subsequent phases. No persistent auth or data fetching can occur without it.
- **Phase 2 (Auth & RLS)** must be established before building the Admin Dashboard or securing customer order histories.
- **Phase 3 (Data Layer Migration)** updates `productService.ts` to replace local static fixtures with live Supabase queries, while preserving the existing UI contracts.
- **Phase 4 (Inventory & Order Engine)** depends on the data layer and requires database transactions to guarantee stock consistency.
- **Phase 5 (Payments)** directly depends on the order model from Phase 4 to record incoming transactions and handle webhooks.
- **Phase 6 (Admin Dashboard)** relies on the authenticated merchant context (Phase 2) and the database services (Phases 3 & 4).
- **Phase 7 (Media & Notifications)** layers file uploading and email confirmation onto order completion and product editing.

---

## 8. Exact Next Steps for Implementation

The following prioritized roadmap outlines the immediate tasks for subsequent phases without modifying the frontend:

1. **Step 1: Environment Definition**
   - Create `.env.example` documenting all necessary keys for Supabase, payment gateways, and email dispatch.
2. **Step 2: Database Migration Creation**
   - Author SQL migration scripts (`supabase/migrations/`) defining:
     - Core schema (`tenants`, `business_settings`, `users`, `tenant_memberships`, `categories`, `collections`, `products`, `product_variants`, `product_images`, `inventory_items`, `inventory_movements`, `customers`, `orders`, `order_items`, `discounts`).
     - PostgreSQL triggers for `updated_at` timestamps.
     - Row Level Security (RLS) policies enforcing tenant isolation.
3. **Step 3: Server-Side Supabase Client Setup**
   - Install `@supabase/ssr` to configure cookie-based server authentication for Next.js App Router.
   - Create server client helpers (`src/lib/supabase/server.ts`) and route handler helpers.
4. **Step 4: Seed Database with Existing Catalog**
   - Create a migration/seed script transforming `src/data/products.ts` and `src/data/collections.ts` into initial relational database rows.
5. **Step 5: Connect `productService.ts` to Supabase**
   - Update `src/services/productService.ts` to query Supabase tables with transparent fallback to local fixtures when credentials are unconfigured.
6. **Step 6: Production Checkout & Order Transaction**
   - Connect the checkout form in `src/app/checkout/page.tsx` to call `/api/checkout`.
   - Implement server-side price recalculation, coupon validation, stock reservation, and atomic order creation in `/api/checkout/route.ts`.
7. **Step 7: Payment Gateway Integration**
   - Implement Razorpay / Stripe order creation and add webhook verification in `/api/webhooks/payment/route.ts`.
8. **Step 8: Admin Dashboard Scaffold**
   - Create authenticated admin layout and routes (`/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/discounts`) using existing design tokens.
