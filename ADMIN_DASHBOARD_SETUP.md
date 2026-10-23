# VÉLURE ATELIER — ADMIN DASHBOARD SETUP & PROVISIONING GUIDE

**Target Platform:** VÉLURE ATELIER Executive Command Studio  
**Target Account:** `nandanvarkrish@gmail.com`  
**Role:** Owner / Executive Store Administrator  
**Version:** 1.0.0 Production Release  

---

## 1. OVERVIEW

This document outlines the exact, secure procedure for provisioning administrator access for `nandanvarkrish@gmail.com`, configuring server environment variables, and operating the VÉLURE ATELIER executive dashboard.

---

## 2. STEP-BY-STEP ADMIN ACCOUNT PROVISIONING

To preserve zero-trust security and prevent storing passwords in repository source code, the administrator password is configured privately through Supabase Auth.

### Step 2.1. Create the Account in Supabase Auth (If not already created)
1. Open the **Supabase Dashboard** -> Select your project -> **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter:
   - **User Email:** `nandanvarkrish@gmail.com`
   - **User Password:** A high-entropy password chosen securely by the store owner.
   - **Auto Confirm User:** Checked (`true`).
4. Click **Create User**.

### Step 2.2. Elevate Account to Administrator Role
Choose one of the following two safe methods:

#### Method A: Using the Server-Side CLI Script (Recommended)
From your terminal or CI environment with service-role access:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/provision-admin.mjs --email nandanvarkrish@gmail.com --role owner
```

**What this does:**
1. Connects to Supabase Auth API using the private server key.
2. Sets `app_metadata.role = 'owner'` on the user record in `auth.users`.
3. Upserts a membership record in `tenant_memberships` table for the primary tenant with `role = 'owner'`.

#### Method B: Direct SQL Query in Supabase Dashboard
Open **Supabase Dashboard** -> **SQL Editor** -> Execute:
```sql
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nandanvarkrish@gmail.com';

    IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
        INSERT INTO tenant_memberships (tenant_id, user_id, role, updated_at)
        VALUES (v_tenant_id, v_user_id, 'owner', NOW())
        ON CONFLICT (tenant_id, user_id)
        DO UPDATE SET role = 'owner', updated_at = NOW();
        RAISE NOTICE 'Successfully granted owner role to nandanvarkrish@gmail.com';
    ELSE
        RAISE EXCEPTION 'User not found in auth.users. Please create user in Authentication panel first.';
    END IF;
END $$;
```

---

## 3. REQUIRED ENVIRONMENT VARIABLES

Ensure the following variables are configured in `.env.local` (local) and Vercel Project Settings (production):

```bash
# Supabase Connectivity
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Application URL
NEXT_PUBLIC_APP_URL=https://velure-atelier.com

# Authorized Administrator Email Whitelist
ADMIN_EMAILS=nandanvarkrish@gmail.com
```

---

## 4. ACCESSING THE DASHBOARD

1. Visit `/login` in your web browser.
2. Sign in with:
   - Email: `nandanvarkrish@gmail.com`
   - Password: Your securely configured password.
3. Upon authentication, navigate to `/admin` or click **Atelier Studio** in the account menu.
4. The dashboard verifies your session on the server via `verifyAdminAccessAction()`.
5. Access is granted with **Owner** status.

---

## 5. DASHBOARD NAVIGATION & CAPABILITIES

| Section | Route | Capabilities |
| :--- | :--- | :--- |
| **Overview** | `/admin` | Executive KPI cards (Gross Sales, Net Sales, AOV, Orders) with period comparisons, operational breakdown, daily revenue velocity chart, and recent commissions. |
| **Commissions & Orders** | `/admin/orders` | Search by ID/patron/AWB, filter by status, payment, and time window. Update fulfillment status, record AWB tracking, inspect order items. |
| **Garments & Catalog** | `/admin/products` | Create, edit, publish, and unpublish bespoke garments. Manage fabrics, sizes, colors, variants, images, and pricing. |
| **Inventory Desk** | `/admin/inventory` | View SKU-level stock, low-stock alerts, out-of-stock variants. Perform safe stock adjustments with documented reasons and audit trails. |
| **Patrons & Clients** | `/admin/customers` | Search patron directory, view verified lifetime spend, order history, and contact coordinates. |
| **Executive Analytics** | `/admin/analytics` | Deep time-series graphs: Gross revenue, order volume, revenue vs refunds, commission status mix, and product category sales. |
| **Returns & Refunds** | `/admin/returns` | Review patron 14-day return claims and cancellation requests. Approve with automated inventory restocking and refund auditing, or decline with reason. |
| **Promotions & Discounts** | `/admin/discounts` | Configure promotional voucher codes, percentage/fixed discounts, minimum subtotal thresholds, and active toggles. |
| **Atelier Settings** | `/admin/settings` | Manage store contact details, low-stock threshold triggers, free shipping thresholds, and public return policy text. |

---

## 6. TROUBLESHOOTING

- **"Atelier Access Restricted" message:**
  Verify that your account has been elevated using Method A or B, or verify that `ADMIN_EMAILS` includes your exact email address.
- **Session expires during development:**
  Sign out using the **Exit** button in the sidebar footer and sign in again at `/login`.
