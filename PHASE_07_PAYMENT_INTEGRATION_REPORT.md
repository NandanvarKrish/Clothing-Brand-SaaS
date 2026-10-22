# Phase 07: Payment Gateway Evaluation & Safe Integration Report

**Project**: VÉLURE ATELIER (Luxury E-Commerce SaaS)  
**Evaluator**: Senior Payment Integration & Security Architect  
**Evaluated Repository**: `https://github.com/youpi-pg/YouPI-PG.git`  
**Execution Date**: October 2026  
**Status**: ⚠️ **EXPERIMENTAL ADAPTER ISOLATED — LIVE MONEY PROCESSING DISABLED**

---

## 1. Production Suitability Decision & Evidence

### **DECISION: NOT SUITABLE FOR PRODUCTION**
Live real-money payment processing is **STRICTLY DISABLED**.

### **Supporting Evidence**:
1. **Uncertified Banking Scraping**: YOUPI PG V2 is an independent research project. Rather than connecting to certified NPCI/banking aggregator rails (e.g., Razorpay, Cashfree, PayU, Stripe), it relies on an Android APK reading incoming notifications/SMS and Gmail scrapers polling bank credit alert emails.
2. **Single-Slot Concurrency Deadlock**: Because personal and standard retail UPI accounts cannot issue dynamic virtual accounts (VANs), the gateway enforces an exclusive single-slot FIFO queue. Only one customer in the world can view a QR code at any time per receiving account, making it impossible to support concurrent shoppers.
3. **Regulatory Non-Compliance**: Operating uncertified scraping software to process commercial e-commerce payments in India violates RBI payment aggregator guidelines and bank terms of service, leading to frozen accounts and compliance penalties.
4. **Zero Programmatic Refund Rails**: Personal UPI rails have no refund APIs. All returns, chargebacks, and cancellations must be handled manually via bank merchant portals.

---

## 2. Integration Architecture & Provider Abstraction

To ensure that Vélure Atelier can safely evaluate YouPI in development while supporting approved aggregators in production, Phase 07 introduces a provider-agnostic abstraction in `src/services/payment/`:

```
src/services/payment/
├── types.ts              # Universal PaymentProvider interface & contract types
├── youpiProvider.ts      # Isolated YouPI PG V2 REST + HMAC adapter (isProductionReady: false)
├── mockProvider.ts       # Deterministic test sandbox adapter
└── paymentService.ts     # Authoritative orchestrator, anti-tampering & state machine
```

### Safety Invariant
Both `YoupiPaymentProvider` and `MockPaymentProvider` enforce the following guard:
```ts
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_PAYMENTS !== 'true') {
  throw new Error('SECURITY EXCEPTION: Test payment provider cannot be activated in production.');
}
```

---

## 3. Verified API & Webhook Contract

### A. Payment Session Creation
- **Endpoint**: `POST /api/v1/payments`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Merchant-Id`: `00000000-0000-0000-0000-000000000001`
  - `X-Merchant-Key`: `<webhookSecret>` (authorizes private session access)
  - `Idempotency-Key`: Unique UUID per attempt
- **Payload**:
  ```json
  {
    "orderId": "VEL-2024-8842",
    "amount": "3850.00",
    "currency": "INR",
    "returnUrl": "https://atelier.velure.in/order-confirmation?order=VEL-2024-8842",
    "customer": {
      "name": "Priya Sundaram",
      "email": "priya@example.com",
      "phoneNumber": "9820144521"
    },
    "metadata": { "internalOrderId": "ord_101", "attemptId": "pay_att_202" }
  }
  ```
- **Response**: `HTTP 201 Created` with `paymentId`, `status`, and `checkoutUrl`.

### B. Inbound Webhook Specification
- **Endpoint**: `/api/webhooks/payment`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Gateway-Event`: `SUCCESS` | `FAILED` | `EXPIRED` | `CANCELLED`
  - `X-Gateway-Signature`: `sha256=<64_hex_chars>`
  - `X-Gateway-Delivery-Id`: Unique UUID
  - `X-Gateway-Timestamp`: Millisecond epoch string
- **Verification Rule**: HMAC-SHA256 calculated over the **raw unparsed UTF-8 request bytes** using `crypto.timingSafeEqual`.
- **Payload**:
  ```json
  {
    "event": "SUCCESS",
    "paymentId": "c7942127-14e3-469a-9e4a-9359a16f903a",
    "orderId": "VEL-2024-8842",
    "amount": "3850.00",
    "amountPaise": 385000,
    "currency": "INR",
    "method": "UPI",
    "utr": "429482104921",
    "completedAt": "2026-10-21T14:30:00.000Z"
  }
  ```

---

## 4. State Machine & Order Lifecycle Mapping

| Webhook Event | Order Payment Status | Order Fulfillment Status | Side Effects |
| :--- | :--- | :--- | :--- |
| *(Checkout Created)* | `pending` | `pending` (Prepaid) / `confirmed` (COD) | Stock reserved in `inventory_items` |
| `SUCCESS` | `paid` | `confirmed` | Bank reference (UTR) stored; order released for master-tailor dispatch |
| `FAILED` | `failed` | `pending` | Customer notified; retry available |
| `EXPIRED` | `failed` | `cancelled` | Stock reservation released back to inventory |
| `CANCELLED` | `failed` | `cancelled` | Stock reservation released back to inventory |

---

## 5. Files Created & Modified

### Created Files
- [`PAYMENT_GATEWAY_SECURITY_REVIEW.md`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/PAYMENT_GATEWAY_SECURITY_REVIEW.md): In-depth security analysis of YouPI PG V2.
- [`src/services/payment/types.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/services/payment/types.ts): Universal payment provider interface and DTOs.
- [`src/services/payment/youpiProvider.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/services/payment/youpiProvider.ts): Isolated YouPI PG V2 adapter.
- [`src/services/payment/mockProvider.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/services/payment/mockProvider.ts): Deterministic test sandbox adapter.
- [`src/services/payment/paymentService.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/services/payment/paymentService.ts): Authoritative payment session & webhook orchestrator.
- [`src/app/api/payments/initiate/route.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/api/payments/initiate/route.ts): Payment session creation route.
- [`src/app/api/payments/[id]/status/route.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/api/payments/[id]/status/route.ts): Safe payment status lookup route.
- [`src/app/api/payments/simulate-webhook/route.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/api/payments/simulate-webhook/route.ts): Test webhook simulation route.
- [`src/app/api/webhooks/payment/route.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/api/webhooks/payment/route.ts): Authoritative HMAC-SHA256 webhook endpoint.
- [`src/app/checkout/mock-gateway/page.tsx`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/checkout/mock-gateway/page.tsx): Sandbox simulator UI for testing payment states.
- [`tests/payment-integration.test.mjs`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/tests/payment-integration.test.mjs): Unit tests covering 12 critical payment scenarios.
- [`PHASE_07_PAYMENT_INTEGRATION_REPORT.md`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/PHASE_07_PAYMENT_INTEGRATION_REPORT.md): This report.

### Modified Files
- [`src/services/orderService.ts`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/services/orderService.ts): Added `bankReferenceNumber`, `paymentAttempts` metadata, and `updateOrderStatus()`.
- [`src/app/checkout/page.tsx`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/checkout/page.tsx): Wired digital payment methods to `/api/payments/initiate`.
- [`src/app/order-confirmation/page.tsx`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/src/app/order-confirmation/page.tsx): Added live settlement refresh, UTR display, and retry actions for failed payments.
- [`.env.example`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/.env.example): Documented payment variables and production safeguards.
- [`package.json`](file:///Users/krishnandanvar/Documents/Clothing-Brand-SaaS/package.json): Added `tests/payment-integration.test.mjs` to the test suite.

---

## 6. Environment Configuration Required

```ini
# Active provider selection ('mock' for local sandbox, 'youpi' for dev testing)
PAYMENT_PROVIDER=mock

# Production safeguard (test providers will fail if NODE_ENV=production and this is false)
ALLOW_TEST_PAYMENTS=false

# Mock Sandbox Secret
MOCK_WEBHOOK_SECRET=atelier_test_mock_webhook_secret_key_32c

# YouPI PG V2 Gateway Configuration (Local Development Only)
YOUPI_API_URL=http://localhost:6100
YOUPI_MERCHANT_ID=00000000-0000-0000-0000-000000000001
YOUPI_WEBHOOK_SECRET=your_youpi_webhook_secret_key_placeholder
YOUPI_AUTO_ACTIVATE=false
```

---

## 7. Automated Testing Results

All 4 test suites passed with 100% compliance:

```
> npm test

Running transform and stock reservation self-check...
Self-check completed: All assertions passed.
Running cart & wishlist domain self-check...
All cart & wishlist self-checks passed successfully!
Running Atelier Checkout & Order Domain Self-Check...
✓ Pricing recalculation & client tampering resistance verified
✓ Coupon validation & minimum subtotal eligibility rules verified
✓ Shipping method & dynamic shipping charge rules verified
✓ Stock conflict and batch availability safeguards verified
✓ Idempotent checkout initiation and duplicate request prevention verified
✓ Order status and pending-payment lifecycle rules verified
✓ Immutable order item snapshot integrity verified

All Atelier Checkout & Order Foundation tests passed successfully!

Running Phase 07: Payment Gateway Integration Test Suite...

✓ 1. Payment session creation from trusted order verified
✓ 2. Non-existent order rejected with 404
✓ 3. Amount mismatch & tampering rejected with 400
✓ 4. Foreign currency mismatch rejected
✓ 5. Invalid HMAC signature rejected with 401
✓ 6. Malformed JSON payload rejected with 400
✓ 7. Valid SUCCESS webhook transitions order to paid and stores UTR
✓ 8. Duplicate webhook delivery handled idempotently
✓ 9. Failed & Expired webhook events transition order safely
✓ 10. Cancelled payment event transitions fulfillment to cancelled
✓ 11. Production safeguard strictly blocks uncertified test providers
✓ 12. Constant-time timing-safe HMAC verification verified

All Phase 07 Payment Gateway Integration tests passed successfully!
```

---

## 8. Remaining Manual Setup & Path to Production

To take Vélure Atelier to production with real customer payments:
1. **Choose an Approved Payment Aggregator**: Select Razorpay, Cashfree, or Stripe India.
2. **Implement Provider Plugin**: Add `RazorpayPaymentProvider` implementing `PaymentProvider` in `src/services/payment/`. No changes to checkout UI, order creation, or cart reconciliation will be required.
3. **Execute Remote Migrations**: Run migrations `000001` through `000004` in the Supabase SQL Editor to enable database row persistence.
