# PHASE 08: ORDER LIFECYCLE MANAGEMENT — IMPLEMENTATION PLAN

**Project:** VÉLURE ATELIER (Luxury Small-Batch Clothing E-Commerce SaaS)  
**Phase:** 08 — Order Lifecycle Management, Cancellations, Returns, Admin Management & Notifications  
**Author:** Senior Full-Stack Software Engineer & Backend Architect  
**Date:** October 23, 2026  
**Status:** In Progress (Audit Complete, Implementation Starting)  

---

## 1. Executive Summary & Objectives

The goal of Phase 08 is to implement a robust, reliable, and secure order lifecycle management system for Vélure Atelier without altering the established Next.js 14 / TypeScript / Tailwind / Supabase architecture or redesigning the luxury storefront.

This includes:
1. **Separation of Payment & Fulfillment States**: Guaranteeing that payment status (`pending`, `paid`, `failed`, `refunded`, etc.) and fulfillment status (`pending`, `confirmed`, `tailoring`, `dispatched`, `delivered`, `cancelled`, etc.) remain orthogonal and strictly validated.
2. **Customer Order Experience**: Comprehensive order history (`/account/orders`), detailed commission view (`/account/orders/[orderNumber]`), live tracking details, and verified ownership (IDOR defense).
3. **Cancellation & Return System**: Rule-governed customer cancellation requests prior to crafting/dispatch, item-level return requests for delivered orders within a configurable policy window (14 days), and admin approval/rejection workflows.
4. **Admin Order Management**: A dedicated `/admin/orders` workspace to search, filter, inspect commission snapshots, update dispatch tracking (AWB/carrier/URL), and process return/cancellation requests with audit notes.
5. **Inventory & Accounting Correctness**: Atomic reservation holds on checkout, stock deduction on dispatch, verified restocking on approved returns, and prevent duplicate inventory movement or refund transactions.
6. **Notification Subsystem**: Provider-agnostic notification event dispatcher for customer and atelier alerts on order milestone transitions.

---

## 2. Architecture & Discovery Findings

### 2.1 Current Implementation (Phases 01–07)
- **Order Creation (`src/services/orderService.ts`)**:
  - Creates immutable order item snapshots (`order_items`).
  - Calculates subtotal, discounts, and shipping authoritatively on the server.
  - Generates unique order number `VEL-YYYY-XXXX`.
  - Reserves inventory in `inventory_items.quantity_reserved`.
  - Stores orders in Supabase `orders` table with fallback to in-memory `globalOrders` repository for CI/offline resilience.
- **Payment Lifecycle (`src/services/payment/`)**:
  - Webhooks from mock gateway or YouPI gateway verify HMAC-SHA256 signatures over raw body bytes.
  - Valid capture webhook updates `paymentStatus = 'paid'`, `fulfillmentStatus = 'confirmed'`, and records the bank reference number (UTR).
  - Failed/expired webhooks transition `paymentStatus = 'failed'`, `fulfillmentStatus = 'cancelled'`, and release reserved inventory.
- **Customer Account (`src/app/account/orders/page.tsx`)**:
  - Simple list with collapsible accordion querying `orders` table directly from client Supabase.
  - Status display maps everything to either "Delivered" or "Order Confirmed".
  - Lacks dedicated detail pages, cancellation requests, or return requests.
- **Admin Area (`src/app/admin/`)**:
  - Only `/admin/products` exists; no order management interface exists for atelier staff.

### 2.2 Identified Gaps & Inconsistencies
| Gap # | Area | Description | Severity | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **G-01** | **Database Schema** | `order_status` ENUM in `000001_initial_schema.sql` lacks `cancellation_requested`, `return_requested`, and `returned`. `payment_status` lacks `paid`. | High | Create migration `20261018000005_order_lifecycle.sql` extending ENUMs and adding cancellation/audit columns. |
| **G-02** | **Security / IDOR** | `GET /api/orders/[orderNumber]` returned order data to anyone without checking customer authentication or ownership. | Critical | Add server-side authentication and customer ownership checks (`order.customerId === user.id` or matching email/session, or admin role). |
| **G-03** | **Customer Experience** | Missing dedicated order details page (`/account/orders/[orderNumber]`) with timeline, breakdown, and cancellation/return actions. | High | Build `/account/orders/[orderNumber]/page.tsx` maintaining luxury atelier aesthetic. |
| **G-04** | **Lifecycle Transitions** | No centralized state machine validating legal fulfillment and payment transitions (e.g., delivered orders could theoretically be reverted). | High | Implement `OrderStateMachine` in `src/services/orderService.ts` rejecting illegal transitions. |
| **G-05** | **Cancellation & Returns** | No API endpoints or data services for customer cancellation or item-level return requests. | High | Create `src/services/returnService.ts` and API routes `POST /api/orders/[orderNumber]/cancel` and `POST /api/orders/[orderNumber]/return`. |
| **G-06** | **Admin Orders UI** | Atelier staff have no administrative dashboard to view commissions, update tracking, or review return/cancellation requests. | High | Build `/admin/orders/page.tsx` with search, multi-faceted filtering, detail modals, and server actions. |
| **G-07** | **Inventory Alignment** | Dispatched orders need permanent stock deduction from `quantity_on_hand`; approved returns need audit logging in `inventory_movements`. | Medium | Implement atomic inventory adjustment upon shipment dispatch and return restocking. |
| **G-08** | **Notifications** | Milestone transitions (confirmation, dispatch, cancellation decision, refund) had no notification hooks. | Medium | Build `src/services/notificationService.ts` with clean provider interface. |

---

## 3. Order Status & Lifecycle State Machine

### 3.1 Separate State Orthogonality
Payment status and fulfillment status are managed independently:

```
PAYMENT STATUS LIFECYCLE:
  pending ──► authorized ──► captured / paid ──► partially_refunded ──► refunded
     │                               ▲
     └──► failed                     │
                                     └── (Offline Bank Transfer Verified)

FULFILLMENT STATUS LIFECYCLE:
  pending (Prepaid awaiting payment)
     │
     ▼ (Payment captured OR COD confirmed)
  confirmed
     │
     ▼ (Tailoring begins)
  tailoring / processing
     │
     ▼ (Quality inspection passed)
  inspection
     │
     ▼ (BlueDart Air waybill generated)
  dispatched / shipped
     │
     ▼ (Delivered to patron)
  delivered
     │
     ▼ (Patron initiates return within 14 days)
  return_requested ──► returned (Inspected & restocked) / return_rejected

CANCELLATION BRANCH:
  [pending, confirmed, tailoring] ──► cancellation_requested ──► cancelled (Stock released)
```

### 3.2 Transition Validity Matrix
| Current Fulfillment Status | Permitted Next Statuses | Condition |
| :--- | :--- | :--- |
| `pending` | `confirmed`, `cancelled`, `cancellation_requested` | Payment captured or user cancels |
| `confirmed` | `tailoring`, `processing`, `cancellation_requested`, `cancelled` | Tailor accepts or user cancels |
| `tailoring` / `processing` | `inspection`, `cancellation_requested`, `cancelled` | Crafting complete or admin cancels |
| `inspection` | `dispatched`, `shipped`, `tailoring` (rework) | QA check passed or needs adjustments |
| `dispatched` / `shipped` | `delivered` | Courier reports delivery |
| `delivered` | `return_requested` | Within return policy window (14 days) |
| `cancellation_requested`| `cancelled`, `confirmed`, `tailoring` | Admin approves or rejects cancellation |
| `return_requested` | `returned`, `delivered` (rejected) | Admin approves return, inspects, and restocks |
| `cancelled` | *(Terminal state)* | None |
| `returned` | *(Terminal state)* | None |

---

## 4. Policy Configuration (`src/lib/orderPolicyConfig.ts`)

Configurable parameters placed in centralized configuration without hardcoding assumptions:

```ts
export const ORDER_POLICY = {
  // Returns
  RETURN_WINDOW_DAYS: 14, // 14-day return window from delivery date
  RETURN_ELIGIBLE_FULFILLMENT_STATUSES: ['delivered'],
  RETURN_REASONS: [
    'Size / Fit Adjustment Required',
    'Fabric Drape / Texture Not as Anticipated',
    'Color Shade Variance Under Ambient Light',
    'Crafting or Stitching Inconsistency',
    'Incorrect Garment Delivered',
    'Other Bespoke Inquiry',
  ],

  // Cancellations
  CANCELLATION_ELIGIBLE_STATUSES: ['pending', 'confirmed'], // Prior to active cutting/tailoring
  CANCELLATION_REASONS: [
    'Changed Mind / Ordered by Mistake',
    'Incorrect Size or Color Selected',
    'Need Delivery by Earlier Date',
    'Modifying Delivery Address',
    'Other',
  ],

  // Shipping Carriers
  DEFAULT_CARRIER: 'BlueDart Express Air',
  CARRIERS: ['BlueDart Express Air', 'Delhivery Express', 'DHL Express India'],

  // Restocking & Refunds
  AUTO_RESTOCK_ON_CANCELLATION: true,
  AUTO_RESTOCK_ON_RETURN_APPROVED: true,
  REFUND_MODE: 'manual_review', // 'manual_review' for YouPI/COD; 'gateway' when certified aggregator deployed
};
```

---

## 5. Implementation Roadmap & Steps

### Step 1: Database Migration (`supabase/migrations/20261018000005_order_lifecycle.sql`)
- Add missing enum values to `order_status` and `payment_status`.
- Add cancellation reason, requested timestamp, and review notes to `orders`.
- Verify RLS policies on `orders`, `returns`, `return_items`, and `order_status_history`.

### Step 2: Policy Config & Notification Service
- Create `src/lib/orderPolicyConfig.ts`.
- Create `src/services/notificationService.ts` with clean console/event-driven provider interface.

### Step 3: Core Domain Services
- Update `src/services/orderService.ts` with:
  - Transition validation state machine (`validateTransition`).
  - Ownership-aware order queries (`getCustomerOrders`, `getOrderForUser`).
  - Customer cancellation request handler (`requestOrderCancellation`).
  - Admin status and tracking updater (`updateOrderFulfillment`).
  - Audit history logging in `order_status_history`.
- Create `src/services/returnService.ts`:
  - `createReturnRequest()` (supports item-level selection, quantities, reason, and customer notes).
  - `getReturnsForOrder()` & `getReturnByNumber()`.
  - `reviewReturnRequest()` (approve/reject with recorded reason, inventory restock, and refund record creation).

### Step 4: Server Actions & Secure API Endpoints
- Create `src/actions/orderActions.ts` (customer cancellation and return requests with auth check).
- Create `src/actions/adminOrderActions.ts` (admin status updates, tracking updates, cancellation and return approvals with admin auth check).
- Update `GET /api/orders/[orderNumber]/route.ts` to enforce authentication and IDOR prevention.
- Create `GET /api/orders/route.ts` (retrieves authenticated customer's own order history).

### Step 5: Customer Frontend Experience
- Update `src/app/account/orders/page.tsx` with live status badges, payment state indicators, and direct link to full commission details.
- Create `src/app/account/orders/[orderNumber]/page.tsx` displaying:
  - Complete order timeline and progress tracker.
  - Immutable item list with images, variants, prices.
  - Priority courier tracking card with AWB and carrier.
  - Payment and settlement breakdown (UTR, method, GST).
  - Interactive "Request Cancellation" button/modal (when eligible).
  - Interactive "Request Return" button/modal (when eligible).

### Step 6: Admin Orders Workspace
- Create `src/app/admin/orders/page.tsx`:
  - Order search by order number, customer name, email, or AWB.
  - Filter tabs: All, Pending Payment, Confirmed, Tailoring, Dispatched, Delivered, Cancellation Requested, Return Requested, Cancelled.
  - Order Detail Drawer / Modal with timeline.
  - Fulfillment status updater with carrier and AWB tracking input.
  - Cancellation review modal (Approve & Restock / Reject).
  - Return review modal (Approve & Restock / Reject).
- Add navigation tabs between `/admin/products` and `/admin/orders`.

### Step 7: Automated Test Suite & Verification
- Create `tests/order-lifecycle.test.mjs` verifying:
  - Valid and invalid status transitions.
  - Customer access control and IDOR defense.
  - Cancellation eligibility rules and duplicate request rejection.
  - Return eligibility rules, item selection, and policy window checks.
  - Inventory restocking correctness on cancellation and return.
  - Refund tracking without fake payment bypass.
- Execute `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

---

## 6. Migration & Safety Considerations
1. **Zero Downtime Fallback**: All order services maintain dual-mode operation (Supabase PostgreSQL first, graceful server memory cache fallback if tables are unseeded).
2. **Refund Safety**: Because YouPI and COD lack automated programmatic refund rails, approved returns and cancellations transition refund state to `pending_manual_review` and record customer bank coordinates for audited manual payout. No fake automatic charges or refunds are executed.
3. **Preservation of Design System**: All new customer and admin pages reuse existing typography, Tailwind palettes (`surface`, `primary`, `secondary`, `outline-variant`), and Lucide icons.
