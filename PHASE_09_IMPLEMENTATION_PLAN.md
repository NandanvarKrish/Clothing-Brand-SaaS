# VÉLURE ATELIER — PHASE 09: ADMIN DASHBOARD & STORE MANAGEMENT IMPLEMENTATION PLAN

**Target**: Implement a secure, unified, and aesthetically aligned Admin Dashboard and Store Management Suite for VÉLURE ATELIER.
**Date**: October 2026
**Architecture**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase SSR Auth, PostgreSQL.

---

## 1. Audit of the Existing Codebase

### 1.1 Existing Admin Capabilities
- **Product Management (`/admin/products`)**:
  - Implemented in Phase 03/04 (`src/app/admin/products/page.tsx`).
  - Supports product creation, editing, category selection, image upload via Supabase Storage, variant definitions, and stock updating.
  - Server actions in `src/actions/adminProductActions.ts` validate inputs with Zod schemas (`src/lib/validations/product.ts`).
- **Order Lifecycle Management (`/admin/orders`)**:
  - Implemented in Phase 08 (`src/app/admin/orders/page.tsx`).
  - Supports multi-field search (order number, customer name, email, AWB tracking), fulfillment milestone updates, courier tracking link assignments, and review desks for cancellation and return requests.
  - Server actions in `src/actions/adminOrderActions.ts` interact with `orderService.ts` and `returnService.ts`.

### 1.2 Identified Gaps & Missing Admin Surfaces
1. **No Unified Admin Layout & Shell**:
   - Currently, `/admin/products` and `/admin/orders` render their own standalone navigation bars.
   - Missing `src/app/admin/layout.tsx` providing a unified responsive sidebar/header with brand identity, live route indicators, staff profile pill, and logout action.
2. **Missing Executive Overview Dashboard (`/admin`)**:
   - No main overview page (`src/app/admin/page.tsx`) exists yet.
   - Missing executive KPIs: Gross Sales, Net Sales, Total Orders, Processing Queue, Dispatched/Delivered Counts, Total Customers, Active Catalog Count, Low-Stock / Out-of-Stock Alerts, Recent Orders stream, and Sales Trends.
3. **No Dedicated Inventory Workspace (`/admin/inventory`)**:
   - Stock can only be edited variant-by-variant inside the product modal.
   - Missing dedicated inventory grid with SKU lookup, on-hand vs reserved vs available inventory, low-stock filter, out-of-stock filter, and stock adjustment dialog with mandatory audit reasons (`restock`, `damaged_writeoff`, `manual_adjustment`).
4. **No Customer Directory (`/admin/customers`)**:
   - Missing interface to view patrons, total orders, lifetime expenditure, contact coordinates, and registered dates.
5. **No Discount Management (`/admin/discounts`)**:
   - Coupons (`FESTIVE10`, `WELCOME15`, `ATELIER20`) are validated in code and modeled in database `coupons`, but administrators have no UI to create, toggle, or adjust coupon rules and minimum subtotals.
6. **No Store Settings Workspace (`/admin/settings`)**:
   - Missing UI to configure non-secret operational parameters: brand contact info, low-stock alert thresholds, shipping charges, and policy return windows.
7. **Authorization & Security Layer**:
   - While server actions check `user != null`, there is no unified role-checking helper (`isUserAdmin` / `assertAdminUser`).
   - Middleware does not protect `/admin` routes from unauthorized access.
   - Need an `admin_audit_logs` migration and service to log privileged actions (stock corrections, order overrides, coupon modifications).

---

## 2. Target Architecture & Scope

```
src/app/admin/
├── layout.tsx                # Unified Admin Shell (Sidebar, Header, Role Verification, Responsive Mobile Nav)
├── page.tsx                  # Executive Dashboard Overview (KPIs, Sales Trends, Revenue, Recent Activity)
├── products/page.tsx         # Product Catalog Management (Created in Phase 03/04, integrated with layout)
├── inventory/page.tsx        # Dedicated Stock Workspace (SKU table, low-stock filter, atomic adjustments)
├── orders/page.tsx           # Order & Return Management (Created in Phase 08, integrated with layout)
├── customers/page.tsx        # Patron Directory (Search, order counts, lifetime gross spend, profile details)
├── discounts/page.tsx        # Promotional & Coupon Desk (Create code, set min subtotal, expiry, active status)
└── settings/page.tsx         # Operational Store Settings (Contact info, shipping fees, return window, stock thresholds)
```

### Core Supporting Services & Actions:
- `src/lib/adminAuth.ts`: Unified server-side authorization (`assertAdminUser`, `isUserAdmin`, `getAdminSession`).
- `src/services/adminAnalyticsService.ts`: Authoritative calculation of financial metrics (gross sales, net sales, refund deductions, order status distributions, sales trends).
- `src/services/adminInventoryService.ts`: Stock lookup, atomic adjustments, low-stock evaluations, movement audit logs.
- `src/services/adminCustomerService.ts`: Customer directory queries with lifetime spend and order counts.
- `src/services/adminDiscountService.ts`: Coupon management, activation toggles, and validation.
- `src/services/adminSettingsService.ts`: Safe operational settings read/write from `business_settings`.
- `src/services/auditLogService.ts`: Centralized audit logging for privileged mutations.
- `src/actions/adminDashboardActions.ts`: Next.js Server Actions connecting the UI to admin services.
- `supabase/migrations/20261018000006_admin_dashboard.sql`: Schema additions for `admin_audit_logs` and seed data.

---

## 3. Step-by-Step Implementation Strategy

### Phase 9.1: Database Migration & Admin Authorization Security
1. Create `supabase/migrations/20261018000006_admin_dashboard.sql`:
   - Table `admin_audit_logs` with columns `id`, `tenant_id`, `user_id`, `user_email`, `action`, `entity_type`, `entity_id`, `details`, `created_at`.
   - Seed default `coupons` and `business_settings` if not present.
   - RLS policies ensuring only admins can read audit logs.
2. Implement `src/lib/adminAuth.ts`:
   - Authenticate session via Supabase SSR cookies.
   - Verify role against `tenant_memberships` (`role IN ('owner', 'admin')`), `app_metadata.role`, or `user_metadata.role`.
   - Provide fallback for local/test development with `ADMIN_EMAILS` whitelist.
3. Update `src/lib/supabase/middleware.ts`:
   - Intercept `/admin` subroutes and redirect unauthenticated users to `/login?redirectTo=/admin`.
4. Implement `src/services/auditLogService.ts` to record administrative mutations.

### Phase 9.2: Unified Admin Navigation Layout (`src/app/admin/layout.tsx`)
1. Design responsive luxury admin layout preserving VÉLURE ATELIER brand language:
   - Sidebar with navigation links: Overview, Products, Inventory, Orders, Customers, Discounts, Settings.
   - Collapsible mobile drawer for tablet/smartphone views.
   - Header with atelier badge, breadcrumbs, staff profile indicator, and direct storefront link ("View Atelier").
   - Access-denied component when a logged-in non-admin attempts access.

### Phase 9.3: Executive Dashboard Overview (`src/app/admin/page.tsx`)
1. Implement `src/services/adminAnalyticsService.ts`:
   - Gross Sales = $\sum$ `totalAmount` for orders where `paymentStatus === 'paid'`.
   - Net Sales = Gross Sales - Total Approved Refunds.
   - Exclude pending, failed, and cancelled orders from sales figures.
   - Count orders by fulfillment milestone: Awaiting Processing, Dispatched/Shipped, Delivered.
   - Count Active Products, Low-Stock items, Out-of-Stock items.
   - Aggregate sales trends grouped by day/week.
2. Build `src/app/admin/page.tsx` with:
   - KPI metrics cards with percentage changes and clear financial distinctions.
   - Sales trend visualization.
   - Recent orders quick-action list.
   - Low-stock inventory alert drawer.

### Phase 9.4: Inventory Management Workspace (`src/app/admin/inventory/page.tsx`)
1. Implement `src/services/adminInventoryService.ts`:
   - Retrieve all variants with product name, SKU, size, color, `quantity_on_hand`, `quantity_reserved`, available stock.
   - Atomic stock adjustments with movement reason logging (`'restock'`, `'damaged_writeoff'`, `'manual_adjustment'`).
   - Guard against invalid negative stock.
2. Build UI with search, low-stock filter, out-of-stock filter, and stock adjustment modal.

### Phase 9.5: Customer Management (`src/app/admin/customers/page.tsx`)
1. Implement `src/services/adminCustomerService.ts`:
   - Query `customer_profiles` joined with order history.
   - Calculate total orders and total spend per customer.
   - Never expose credentials or auth tokens.
2. Build customer directory with search, filter, and detail drawer.

### Phase 9.6: Discounts & Promotional Desk (`src/app/admin/discounts/page.tsx`)
1. Implement `src/services/adminDiscountService.ts`:
   - List, create, toggle active status, and edit coupons in `coupons` table.
   - Enforce coupon validation rules (code, discount_type, value, min_subtotal, expires_at).
2. Build discounts table and "Create Coupon" modal.

### Phase 9.7: Operational Store Settings (`src/app/admin/settings/page.tsx`)
1. Implement `src/services/adminSettingsService.ts`:
   - Read and write safe business settings (support email, support phone, shipping fees, free shipping threshold, return window, low-stock threshold).
   - Exclude all private API keys and payment secrets from the UI.
2. Build settings form with instant feedback.

### Phase 9.8: Verification, Test Suite & Documentation
1. Create `tests/admin-dashboard.test.mjs` verifying:
   - Analytics calculations (gross vs net sales, excluded pending/failed orders).
   - Admin authorization barriers (owner/admin allowed, customer denied).
   - Atomic inventory adjustments and negative stock protection.
   - Coupon validation and min subtotal constraints.
   - Customer aggregation calculations.
2. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
3. Create `PHASE_09_IMPLEMENTATION_REPORT.md` answering all 15 required sections.
