# PHASE 11: PRODUCTION DEPLOYMENT GUIDE & RUNBOOK
**Platform:** VÉLURE ATELIER — Luxury Fashion E-Commerce  
**Infrastructure Target:** Vercel (Edge & Serverless) + Supabase (PostgreSQL 15, Auth, Storage)  
**Version:** 1.0.0 Production Release  
**Last Updated:** October 2026  

---

## 1. PRE-DEPLOYMENT PREREQUISITES

Before commencing the production deployment, verify access to the following services:
- **GitHub Repository:** Clean `main` branch containing all 11 phases.
- **Supabase Account:** Active production Supabase project (Pro tier recommended for high-availability connection pooling and automated backups).
- **Vercel Account:** Linked to the GitHub organization/repository.
- **Transactional Email Provider (Resend):** Verified sending domain (`velure-atelier.com` or chosen brand domain).
- **Domain Registrar / DNS Provider:** Access to manage DNS records (A, CNAME, TXT for SPF/DKIM).
- **Node.js Environment:** Node 18.x or 20.x LTS installed locally with npm.

---

## 2. SUPABASE DATABASE PROVISIONING & MIGRATION ORDER

Apply the database migrations in strict sequential order against the remote Supabase PostgreSQL instance:

```bash
# Link the local project to your remote Supabase project
npx supabase link --project-ref your-project-ref

# Push all migrations in sequential order
npx supabase db push
```

Alternatively, apply the SQL files in this exact sequence via the Supabase Dashboard SQL Editor:

1. `supabase/migrations/20261018000001_initial_schema.sql`  
   *Creates tables: tenants, customer_profiles, products, variants, inventory, orders, order_items, payments.*
2. `supabase/migrations/20261018000002_row_level_security.sql`  
   *Enables Row Level Security on all tables and provisions multi-tenant RLS policies.*
3. `supabase/migrations/20261018000003_seed_catalog.sql`  
   *Seeds the baseline luxury catalog (garments, variants, images, sizing).*
4. `supabase/migrations/20261018000004_product_management.sql`  
   *Adds category indexing, full-text search vectors, and product management triggers.*
5. `supabase/migrations/20261018000005_order_lifecycle.sql`  
   *Provisions order cancellation, return requests, refund auditing, and state machine constraints.*
6. `supabase/migrations/20261018000006_admin_dashboard.sql`  
   *Adds admin audit logs, manual inventory adjustment movements, and store settings tables.*
7. `supabase/migrations/20261018000007_shipping_notifications.sql`  
   *Creates `notification_events` table for email idempotency, carrier tracking indexes, and unique constraints.*

---

## 3. PRODUCTION ENVIRONMENT VARIABLES CONFIGURATION

Configure the following environment variables in the **Vercel Project Settings -> Environment Variables** for the `Production` environment:

| Variable Name | Required | Target Scope | Example / Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | `https://[PROJECT-ID].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (Supabase Anon Key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | **Server Only** | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (Supabase Service Role Key) |
| `DATABASE_URL` | **Yes** | **Server Only** | `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Client & Server | `https://velure-atelier.com` (Your canonical domain) |
| `NODE_ENV` | **Yes** | System | `production` |
| `PAYMENT_PROVIDER` | **Yes** | **Server Only** | `mock` (for pilot/staging) or certified provider identifier |
| `ALLOW_TEST_PAYMENTS` | **Yes** | **Server Only** | `false` (Mandatory production safeguard) |
| `MOCK_WEBHOOK_SECRET` | **Yes** | **Server Only** | High-entropy 64-char string (e.g., `openssl rand -hex 32`) |
| `RESEND_API_KEY` | **Yes** | **Server Only** | `re_1234567890abcdef...` (Production Resend API key) |
| `EMAIL_FROM` | **Yes** | **Server Only** | `Vélure Atelier <concierge@velure-atelier.com>` |
| `ADMIN_NOTIFICATION_EMAIL` | **Yes** | **Server Only** | `atelier-ops@velure-atelier.com` |
| `ADMIN_EMAILS` | **Yes** | **Server Only** | Comma-separated list of authorized administrator emails |
| `SHIPPING_PROVIDER` | **Yes** | **Server Only** | `manual` (or `bluedart` / `delhivery`) |
| `SHIPPING_WEBHOOK_SECRET` | **Yes** | **Server Only** | High-entropy 64-char string for carrier tracking webhooks |

> [!CAUTION]
> **Secret Segregation Rule:** Never prefix `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `RESEND_API_KEY` with `NEXT_PUBLIC_`. Doing so exposes database superuser access to the public client bundle!

---

## 4. VERCEL PROJECT DEPLOYMENT SETTINGS

1. **Framework Preset:** `Next.js`
2. **Root Directory:** `./`
3. **Build Command:** `npm run build`
4. **Install Command:** `npm install`
5. **Node.js Version:** `20.x`
6. **Output Directory:** `.next` (default)
7. **Git Automation:** Configure `main` branch to trigger automatic production deployments on push.

---

## 5. CUSTOM DOMAIN & DNS CONFIGURATION

### 5.1. Vercel Web Traffic Records
In your DNS provider (Cloudflare, GoDaddy, AWS Route 53), configure:
- **Root Domain (`velure-atelier.com`):**
  - Type: `A`
  - Name: `@`
  - Value: `76.76.21.21` (Vercel Anycast IP)
- **Subdomain (`www.velure-atelier.com`):**
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com.`

### 5.2. Resend Transactional Email DNS Records
To ensure order confirmations and dispatch tracking emails avoid spam filters:
- **DKIM:**
  - Type: `TXT`
  - Name: `resend._domainkey.velure-atelier.com`
  - Value: Provided by Resend console
- **SPF:**
  - Type: `TXT`
  - Name: `@`
  - Value: `v=spf1 include:amazonses.com ~all`
- **DMARC:**
  - Type: `TXT`
  - Name: `_dmarc.velure-atelier.com`
  - Value: `v=DMARC1; p=none; rua=mailto:dmarc-reports@velure-atelier.com`

---

## 6. PAYMENT GATEWAY PRODUCTION STRATEGY

### 6.1. Staging / Private Pilot Mode (Current Supported Configuration)
- `PAYMENT_PROVIDER=mock`
- `ALLOW_TEST_PAYMENTS=true` (Staging preview branch only)
- Uses the built-in deterministic sandbox mock provider (`/checkout/mock-gateway`) for full-flow verification.

### 6.2. Public Commercial Production Cutover
1. Acquire a merchant account with an RBI-authorized Payment Aggregator (Razorpay, Cashfree, or Stripe).
2. Create an implementation adapter adhering to `src/services/payment/types.ts`:
   ```typescript
   export class RazorpayPaymentProvider implements PaymentProvider {
     readonly id = 'razorpay';
     readonly name = 'Razorpay Payment Gateway';
     // Implement createPaymentSession, verifyWebhook, getPaymentStatus
   }
   ```
3. Register the adapter in `src/services/payment/paymentService.ts`.
4. In Vercel, set `PAYMENT_PROVIDER=razorpay` and `ALLOW_TEST_PAYMENTS=false`.
5. Configure the webhook URL in the merchant aggregator dashboard:
   `https://velure-atelier.com/api/webhooks/payment?provider=razorpay`

---

## 7. POST-DEPLOYMENT VERIFICATION RUNBOOK

Execute this quick verification walkthrough immediately following production deployment:

1. **Homepage & Catalog:** Visit `https://velure-atelier.com/shop`. Verify garments load, images render, and price formatting displays correctly in INR (`₹`).
2. **Product Detail Page:** Click a product (e.g., `/products/mulberry-silk-trench-coat`). Verify size selector, availability badge, and image gallery work.
3. **Cart & Reservation:** Add available variant to cart. Confirm cart drawer slides out and line totals match unit price.
4. **Checkout Simulation:** Navigate to `/checkout`. Validate pincode serviceability check. Apply test voucher `VELURE10` and verify ₹2,500 subtotal deduction and 12% GST calculation.
5. **Staff Access:** Navigate to `/admin`. Attempt access with a non-admin account (must be denied with 403 Forbidden). Log in with whitelisted `ADMIN_EMAILS` account (must grant access to studio overview, orders, inventory, and analytics).
6. **Webhook Health:** Send a test POST request to `/api/webhooks/payment`. Ensure unauthenticated or unsigned requests receive HTTP 401 Unauthorized.

---

## 8. ROLLBACK PROCEDURES & INCIDENT RESPONSE

- **Instant Frontend Rollback:** In Vercel Dashboard -> **Deployments**, locate the prior stable deployment and click **Promote to Production**. Rollback completes in under 5 seconds with zero downtime.
- **Database Point-in-Time Recovery:** In Supabase Dashboard -> **Database** -> **Backups**, initiate Point-in-Time Recovery (PITR) to restore PostgreSQL state to any minute within the 7-day retention window.
