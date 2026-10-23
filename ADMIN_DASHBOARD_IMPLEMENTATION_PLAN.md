# VÉLURE ATELIER — ADMIN DASHBOARD IMPLEMENTATION PLAN

**Target System:** VÉLURE ATELIER Admin Dashboard & Executive Management  
**Environment:** Next.js 14.2.24 (App Router), Supabase (PostgreSQL 15, Auth, Storage, RLS)  
**Date:** October 2026  
**Auditor & Architect:** Senior Full-Stack Software Engineer & Security Architect (Antigravity)  

---

## 1. PROJECT AUDIT & CURRENT STATE ANALYSIS

### 1.1. Existing Architectural Foundations
- **Frontend Framework:** Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS with custom Atelier luxury tokens (Cormorant Garamond, `#0F0F0F`, `#F9F6F0`, `#C5A880`, Lucide React icons).
- **Authentication & Authorization:**
  - Supabase Auth session cookies (`@supabase/ssr`).
  - Middleware in `src/lib/supabase/middleware.ts` redirects unauthenticated requests for `/admin` to `/login?redirectTo=/admin`.
  - Server-side authorization in `src/lib/adminAuth.ts` via `getAdminSession()` and `assertAdminUser()`, checking `tenant_memberships`, JWT `app_metadata.role`, and `ADMIN_EMAILS`.
- **Database Schema & Migrations:**
  - Migrations `20261018000001` through `20261018000007` establish `tenants`, `tenant_memberships`, `customer_profiles`, `categories`, `collections`, `products`, `product_variants`, `inventory_items`, `inventory_movements`, `inventory_reservations`, `orders`, `order_items`, `payments`, `shipments`, `returns`, `refunds`, `admin_audit_logs`, and `notification_events`.
  - Row Level Security (RLS) is active on all 30 tables (`20261018000002_row_level_security.sql`).
- **Existing Admin Routes:**
  - `/admin`: Overview KPI cards & basic sales trend bar.
  - `/admin/orders`: Order search, status filter, fulfillment modal, cancellation review modal, return review modal.
  - `/admin/products`: Product listing, search, create/edit modal, variant stock editing.
  - `/admin/inventory`: Variant inventory desk, low/out-of-stock filters, manual adjustment modal with audit reason.
  - `/admin/customers`: Patron directory, verified lifetime spend, order count.
  - `/admin/discounts`: Promotional vouchers, percentage/fixed discount rules, active toggles.
  - `/admin/settings`: Atelier brand contact, low-stock threshold, shipping and return policies.

---

## 2. GAP ANALYSIS & MISSING FUNCTIONALITY

| Area | Current Implementation State | Missing / Required Enhancements |
| :--- | :--- | :--- |
| **Admin Access & Auth** | Client-side `AdminLayout` evaluates email heuristics in the browser. | **Security Defect**: Replace browser-side checks with server-verified action `verifyAdminAccessAction()`. Add migration & idempotent CLI script `scripts/provision-admin.mjs` for `nandanvarkrish@gmail.com`. |
| **Navigation & Pages** | 7 nav items. Lacks dedicated Analytics and Returns/Refunds pages. | Add `/admin/analytics` and `/admin/returns` pages so all 9 suggested navigation destinations are fully working with zero dead links. |
| **KPIs & Metrics** | Basic counts for gross sales, net sales, orders, low stock. | Add Average Order Value (AOV), New Customers in period, Out-of-Stock Variants, Pending Payments separation, and previous-period delta comparisons (+X% / -Y%). |
| **Interactive Charts** | Simple CSS bar chart on overview. | Add multi-range interactive SVG charts: (A) Revenue over time (7d, 30d, 90d, 12m, custom), (B) Orders over time with status breakdowns, (C) Revenue vs Refunds, (D) Order status distribution, (E) Bestselling products from order snapshots, (F) Category breakdown. |
| **Order Management** | Order search by ID, fulfillment update. | Add date-range filtering, payment status filtering, sorting, pagination, and customer email/phone search. |
| **Returns & Refunds** | Handled in small modals inside `/admin/orders`. | Create dedicated `/admin/returns` desk allowing inspection of return items, condition notes, approval with automatic restock and refund audit logging, or decline with reason. |
| **Audit Logging** | Inventory adjustments write to `inventory_movements`. | Standardize privileged mutations through `auditLogService.ts` for status overrides, product archives, and refund processing. |

---

## 3. SECURITY & COMPLIANCE REQUIREMENTS

1. **No Hardcoded Credentials:** The admin password for `nandanvarkrish@gmail.com` must never appear in source code, migrations, logs, or git commits. Account creation is performed via Supabase Auth Console or standard sign-up.
2. **Server-Side Verification Only:** Client components must never determine administrative privileges through client-side string checks. All access decisions originate from `getAdminSession()` verifying cryptographically signed Supabase cookies.
3. **Multi-Tenant & Role Isolation:** Authorization checks `tenant_memberships` table for `role IN ('owner', 'admin')` or JWT `app_metadata.role IN ('owner', 'admin')`, backed by server-side `ADMIN_EMAILS` environment variable.
4. **Service Role Protection:** `SUPABASE_SERVICE_ROLE_KEY` is quarantined to server-only code.
5. **Customer Data Protection:** Customer passwords, hashes, and auth tokens are never queried or exposed by customer management endpoints.
6. **Audit Trails:** All manual stock overrides, voucher creation, and return/cancellation decisions record the administrator ID, timestamp, and justification.

---

## 4. FINANCIAL CALCULATION DEFINITIONS

To prevent misleading analytics or fabricated business statistics, the dashboard adheres to strict financial definitions:

- **Order Value:** The total transaction amount recorded on the order record (`totalAmount = subtotal - discount + tax + shipping`).
- **Gross Sales:** The sum of `totalAmount` for all orders with `paymentStatus IN ('paid', 'captured')`. Unpaid, pending, and failed payment attempts are strictly excluded from sales.
- **Refunds:** The sum of verified refund amounts for orders with `paymentStatus = 'refunded'` or approved partial refunds.
- **Net Sales:** Defined strictly as `Gross Sales - Refunds`.
- **Average Order Value (AOV):** `Gross Sales / Count(Eligible Paid Orders)`. If paid orders count is 0, AOV is ₹0.
- **Pending Payments:** Displayed as a separate operational risk metric (count and gross value), never included in received revenue.
- **Conversion Rate:** Explicitly labeled as `Unavailable (Requires Web Session Analytics)` to prevent fabricating visitor counts.

---

## 5. STEP-BY-STEP IMPLEMENTATION PHASES

### Step 1: Admin Authentication & Provisioning
- Update `src/lib/adminAuth.ts` and `src/actions/adminDashboardActions.ts` with `verifyAdminAccessAction()`.
- Refactor `src/app/admin/layout.tsx` to query `verifyAdminAccessAction()` via server action, eliminating browser-side email heuristic checks.
- Create idempotent provisioning script `scripts/provision-admin.mjs` to grant `nandanvarkrish@gmail.com` admin/owner role via service-role CLI.
- Create migration `supabase/migrations/20261018000008_admin_role_provisioning.sql` ensuring idempotent role assignment in PostgreSQL.

### Step 2: Comprehensive Analytics Service & Financial Calculations
- Extend `src/services/adminAnalyticsService.ts` to compute:
  - Average Order Value (AOV) and previous-period AOV comparison.
  - New customers vs returning customers in selected window.
  - Pending payments count and total.
  - Out-of-stock variant count.
  - Status distribution with counts, percentages, and status colors.
  - Category sales breakdown from historical order item snapshots.
  - Multi-range sales velocity (7d, 30d, 90d, 12m) with daily, weekly, or monthly grouping.
  - Revenue versus refunds time-series.

### Step 3: Executive Analytics Page (`/admin/analytics`)
- Build `src/app/admin/analytics/page.tsx` with interactive SVG charts:
  - Range selector (7 Days, 30 Days, 90 Days, 12 Months).
  - Revenue over time area/line chart with hover tooltips and metric badges.
  - Orders over time bar chart with status breakdown.
  - Revenue vs Refunds dual-series chart.
  - Order status distribution visualizer.
  - Product category performance breakdown.
  - Empty state handling when no sales exist.

### Step 4: Dedicated Returns & Refunds Desk (`/admin/returns`)
- Build `src/app/admin/returns/page.tsx`:
  - List return requests and cancellation requests.
  - Filter by pending, approved, declined.
  - View garment condition notes and items requested for return.
  - Approve or decline actions with restock checkboxes and audit notes.

### Step 5: Enhanced Overview (`/admin`) & Navigation
- Update `src/app/admin/layout.tsx` navigation to include all 9 pages:
  - Overview (`/admin`)
  - Orders (`/admin/orders`)
  - Products (`/admin/products`)
  - Inventory (`/admin/inventory`)
  - Customers (`/admin/customers`)
  - Analytics (`/admin/analytics`)
  - Returns & Refunds (`/admin/returns`)
  - Discounts (`/admin/discounts`)
  - Settings (`/admin/settings`)
- Update `/admin` Overview with period-over-period delta badges (+X% vs prior period), AOV card, pending payments card, and link to Executive Analytics.

### Step 6: Automated Testing & Validation
- Create dedicated admin dashboard test suite `tests/admin-dashboard-v2.test.mjs` testing:
  - Server-side admin verification and non-admin rejection.
  - Accurate financial calculations (Gross, Net, Refunds, AOV, zero division safety).
  - Period-over-period comparisons.
  - Empty database state handling.
  - Secret isolation in store settings.
  - Order status and return transitions.
- Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

### Step 7: Documentation & Deliverables
- Generate:
  - `ADMIN_DASHBOARD_SECURITY_REPORT.md`
  - `ADMIN_DASHBOARD_TEST_REPORT.md`
  - `ADMIN_DASHBOARD_SETUP.md`
  - `ADMIN_DASHBOARD_IMPLEMENTATION_REPORT.md`
