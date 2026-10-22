# VÉLURE ATELIER — PHASE 10: SHIPPING, EMAIL NOTIFICATIONS & DELIVERY INTEGRATION PLAN

**Target**: Implement a provider-independent shipping integration layer, carrier tracking management, luxury transactional HTML email notification system, and webhook security for VÉLURE ATELIER.
**Date**: October 2026
**Architecture**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase SSR Auth, PostgreSQL.

---

## 1. Initial Audit Findings

### 1.1 Existing Shipping & Delivery Assets
- **Database Schema**:
  - `shipments` table exists in `supabase/migrations/20261018000001_initial_schema.sql` with columns `order_id`, `carrier`, `tracking_number`, `tracking_url`, `shipping_status`, `shipped_at`, `delivered_at`.
  - `pincode_serviceability` table exists with `pincode`, `city`, `state`, `estimated_delivery_days`, `courier`, `is_serviceable`, `cod_available`.
  - `orders` table includes `tracking_number`, `carrier`, `tracking_url`, `delivered_at`, `estimated_delivery`.
- **Order Service (`src/services/orderService.ts`)**:
  - `calculateShippingFee` enforces standard air (₹250, free over ₹1,999) and express courier (₹450).
  - `updateOrderFulfillment` updates carrier, tracking number, and tracking URL, and deducts inventory on dispatch.
- **Customer Tracking**:
  - `/account/orders/[orderNumber]` renders a high-level courier card and a 5-stage stepper.
- **Notification Service (`src/services/notificationService.ts`)**:
  - A basic in-app logging dispatcher exists, but lacks real transactional HTML email templates, Resend REST provider integration, event deduplication, idempotency tracking, or database persistence.

### 1.2 Gaps Identified
1. **No Provider-Independent Shipping Architecture**:
   - No dedicated shipping service abstraction (`src/services/shipping/`) supporting address validation, tracking URL generation/sanitization, carrier dispatch manifests, or tracking event history.
2. **Missing Notification Events Ledger (`notification_events`)**:
   - No database table tracking sent emails, provider message IDs, retry counts, or idempotency keys. Repeated webhook events or status changes could cause duplicate customer emails.
3. **No Branded HTML Email Templates**:
   - Missing responsive, editorial email templates for the 11 key lifecycle events (Order Confirmed, Payment Confirmed, Pending/Failed Payment, Custom Tailoring, Dispatch, Delivery, Cancellation, Return Requested, Return Decision, Refund Processed).
4. **No Real Email Service Connector**:
   - No direct connector to Resend (via native `fetch`, avoiding unnecessary npm packages) with graceful fallback to an audited in-memory dispatcher when credentials are not configured.
5. **No Shipping Webhook Receiver**:
   - Missing `/api/webhooks/shipping` endpoint for carrier status updates (in-transit, out for delivery, delivered) with HMAC signature verification and transition validation.
6. **No Admin Shipment Management Action**:
   - Missing a dedicated server action in `src/actions/adminShippingActions.ts` for dispatching shipments, generating AWBs, and recording carrier delivery confirmations.

---

## 2. Target Architecture

```
src/
├── services/
│   ├── shipping/
│   │   ├── types.ts                    # ShippingProvider, ShipmentManifest, TrackingEvent, PincodeInfo
│   │   ├── trackingUrlHelper.ts        # Carrier URL generator with protocol sanitization (XSS defense)
│   │   └── shippingService.ts          # Address validation, shipment creation, delivery confirmation
│   └── email/
│       ├── types.ts                    # EmailPayload, EmailEventRecord, EmailProvider interface
│       ├── templates.ts                # Luxury responsive HTML & plain-text email templates (11 event types)
│       └── emailService.ts             # Resend REST API integration, idempotency deduplication, retry engine
├── actions/
│   └── adminShippingActions.ts         # Server actions for dispatching, tracking sync, and manual delivery
├── app/
│   └── api/
│       └── webhooks/
│           └── shipping/
│               └── route.ts            # Carrier webhook listener with HMAC signature verification
supabase/migrations/
└── 20261018000007_shipping_notifications.sql # Schema for notification_events, shipment indexes, and RLS
```

---

## 3. Step-by-Step Implementation Strategy

### Step 10.1 — Database Migration (`20261018000007_shipping_notifications.sql`)
- Create `notification_events` table for tracking queued, sent, and failed notifications with unique `idempotency_key`.
- Add unique index on `shipments(order_id, tracking_number)` to prevent duplicate courier manifests.
- Configure RLS policies for patron viewing and staff insertion.

### Step 10.2 — Shipping Service & URL Sanitization (`src/services/shipping/`)
- Implement `src/services/shipping/trackingUrlHelper.ts` with strict URL sanitization (only `http:` and `https:`) and standard carrier generators for BlueDart, Delhivery, and DHL.
- Implement `src/services/shipping/shippingService.ts` providing:
  - `validateShippingAddress`: 6-digit pincode validation, city/state resolution, serviceability check.
  - `createShipment`: Idempotent courier manifestation with carrier selection and automated tracking URL generation.
  - `confirmShipmentDelivery`: Validated delivery recording with timestamp synchronization.

### Step 10.3 — Transactional Email System & Templates (`src/services/email/`)
- Implement `src/services/email/templates.ts` with responsive HTML and plain-text alternatives for:
  1. `order_confirmed`
  2. `payment_confirmed`
  3. `payment_pending`
  4. `order_processing`
  5. `shipment_dispatched`
  6. `order_delivered`
  7. `cancellation_confirmed`
  8. `return_requested`
  9. `return_decision`
  10. `refund_processed`
- Implement `src/services/email/emailService.ts`:
  - Direct native `fetch` to Resend API (`https://api.resend.com/emails`) when `RESEND_API_KEY` is present.
  - Idempotency check in `notification_events` to prevent duplicate emails.
  - Fallback to in-app audit ledger for offline and test runs.

### Step 10.4 — Admin Shipping Actions & Customer Tracking
- Implement `src/actions/adminShippingActions.ts` with `assertAdminUser()`.
- Update customer order details page (`src/app/account/orders/[orderNumber]/page.tsx`) with verified shipment milestones, carrier details, and sanitized tracking link.

### Step 10.5 — Carrier Tracking Webhook (`/api/webhooks/shipping`)
- Inbound webhook handler validating HMAC signature using `SHIPPING_WEBHOOK_SECRET`.
- Validates payload structure and ensures fulfillment status transitions follow the state machine (cannot mark unpaid orders as delivered).

### Step 10.6 — Verification, Automated Tests & Documentation
- Build `tests/shipping-notifications.test.mjs` verifying:
  - Pincode and address validation.
  - Tracking URL sanitization.
  - Duplicate shipment prevention.
  - Notification idempotency and deduplication.
  - Resend payload creation and mock dispatch.
  - Carrier webhook signature verification.
  - Shipping fee calculations across thresholds.
- Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Create `PHASE_10_IMPLEMENTATION_REPORT.md` and `PHASE_10_SETUP.md`.
