# VÉLURE ATELIER — PHASE 10: SHIPPING & NOTIFICATIONS SETUP GUIDE

This guide details the exact environment variables, provider requirements, webhook contracts, and manual setup needed to activate live courier logistics and transactional email notifications for VÉLURE ATELIER.

---

## 1. Environment Configuration

Add the following environment variables to your production `.env.local` or hosting provider environment vault (e.g. Vercel, Railway, Supabase):

```bash
# ------------------------------------------------------------------------------
# Transactional Notifications (Resend REST API)
# ------------------------------------------------------------------------------
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_live_or_test_api_key_here

# Verified Sender Address (must match your verified domain in Resend)
EMAIL_FROM="Vélure Atelier <concierge@your-domain.com>"

# Internal Operations Alert Recipient
ADMIN_NOTIFICATION_EMAIL=atelier-ops@your-domain.com

# ------------------------------------------------------------------------------
# Logistics & Courier Tracking
# ------------------------------------------------------------------------------
# Active shipping mode: 'manual' (default) | 'bluedart' | 'delhivery'
SHIPPING_PROVIDER=manual

# Inbound Webhook Secret for HMAC-SHA256 tracking verification
SHIPPING_WEBHOOK_SECRET=your_high_entropy_32_character_webhook_secret
```

---

## 2. Transactional Email Provider (Resend) Setup

VÉLURE ATELIER integrates with Resend via native HTTPS REST dispatch (`https://api.resend.com/emails`). No external SDK dependencies are required.

### Setup Steps:
1. **Create Account**: Register an account at [resend.com](https://resend.com).
2. **Add Domain**: In Resend Dashboard, go to **Domains** -> **Add Domain** (`your-domain.com`).
3. **Configure DNS Records**: Add the provided MX, TXT (SPF), and CNAME (DKIM) records in your DNS provider (e.g. Cloudflare, GoDaddy).
4. **Generate API Key**: Go to **API Keys** -> **Create API Key** with "Sending Access". Copy the `re_...` key.
5. **Verify Sender**: Set `EMAIL_FROM` to an address on your verified domain (e.g., `concierge@your-domain.com`).
6. **Graceful Fallback**: If `RESEND_API_KEY` is not provided or set to a placeholder, the system automatically falls back to the in-app audit ledger without throwing exceptions or interrupting the patron checkout experience.

---

## 3. Courier Logistics & Air Tracking Setup

VÉLURE ATELIER supports **BlueDart Express Air**, **Delhivery Priority Express**, and **DHL Express India**, alongside a dedicated atelier white-glove manual workflow.

### Carrier Tracking Link Generation
The tracking helper generates sanitized, direct tracking links:
- **BlueDart Express Air**: `https://www.bluedart.com/tracking?handler=traking&action=auto&numbers={AWB}`
- **Delhivery Priority Express**: `https://www.delhivery.com/track/package/{AWB}`
- **DHL Express India**: `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id={AWB}`

All external links undergo strict URL protocol sanitization (`http:`/`https:` only) to prevent script injection.

### Inbound Carrier Webhook Configuration
Couriers (or middleware aggregators like Shiprocket) can send delivery milestone callbacks to:
```
POST https://your-domain.com/api/webhooks/shipping
```

#### Authentication Header
Inbound requests must supply an HMAC-SHA256 signature in the header:
```http
X-Shipping-Signature: sha256={HMAC_SHA256_HEX}
```
Computed over the raw JSON payload using your `SHIPPING_WEBHOOK_SECRET`.

#### Payload Specification
```json
{
  "event": "delivered",
  "carrier": "BlueDart Express Air",
  "trackingNumber": "BD-AIR-778899",
  "orderNumber": "VA-2026-1001",
  "location": "Bengaluru Logistics Hub",
  "description": "Handover completed to recipient.",
  "timestamp": "2026-10-23T12:00:00Z"
}
```

#### Security Guardrails
- **Payment Isolation**: Delivery webhooks can update fulfillment to `delivered`, but can **never** mark an order as `paid`.
- **State Validation**: Transition to `delivered` is strictly rejected unless the order has already been manifested and dispatched into courier custody (`shipped`).
- **Idempotency**: Repeated delivery events are acknowledged with `200 OK` without creating duplicate stock adjustments or multiple emails.

---

## 4. Database Migrations

Apply the Phase 10 migration to your Supabase PostgreSQL database:
```bash
npx supabase db push
# or execute supabase/migrations/20261018000007_shipping_notifications.sql in the Supabase SQL editor
```

This ensures the `notification_events` ledger is provisioned with unique idempotency constraints and serviceability pincodes are seeded.
