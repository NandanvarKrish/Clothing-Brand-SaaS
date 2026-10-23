# VÉLURE ATELIER — ADMINISTRATOR ACCESS SETUP & PROVISIONING GUIDE

**Target Account:** `nandanvarkrish@gmail.com`  
**Assigned Role:** `owner` (Maison Director & Store Administrator)  
**Access Model:** Dual Persona (Unified Customer Shopping + Executive Store Management)

---

## 1. Overview & Dual-Persona Architecture

In VÉLURE ATELIER, administrative privileges are **additive** and do not alter or restrict the customer experience:
- When signed in as `nandanvarkrish@gmail.com`, the user has full access to all patron features: product discovery, cart, checkout, saved delivery addresses, and personal order history.
- The user is also granted administrative governance over `/admin/*` (Executive Analytics, Inventory Desk, Order Fulfillment, Return Management, Coupons, and Store Settings).
- Direct access shortcuts ("Studio") appear automatically in the site navigation bar, mobile menu, and Patron Account overview when this account is authenticated.

Administrative authorization is enforced through three layered tiers in `src/lib/adminAuth.ts`:
1. **Supabase Auth JWT `app_metadata.role`** (`'owner'`)
2. **PostgreSQL Database `tenant_memberships`** (`role = 'owner'`)
3. **Server-Side Whitelist Fallback** (`nandanvarkrish@gmail.com`)

---

## 2. Provisioning Methods

Choose either **Method 1 (Recommended SQL)** or **Method 2 (CLI Script)** to grant full administrator status.

---

### Method 1: Supabase Dashboard SQL Editor (Recommended)

This is the fastest, zero-dependency method. It runs directly inside Supabase PostgreSQL and is completely idempotent.

1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/_).
2. Navigate to **SQL Editor** in the left sidebar.
3. Paste and execute the following SQL script:

```sql
-- ==============================================================================
-- VÉLURE ATELIER: IDEMPOTENT ROLE ELEVATION FOR nandanvarkrish@gmail.com
-- ==============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- 1. Obtain primary tenant ID
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    
    -- 2. Locate auth.users record for the target administrator
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nandanvarkrish@gmail.com';

    IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
        -- 3. Upsert tenant membership with 'owner' privileges
        INSERT INTO tenant_memberships (tenant_id, user_id, role, updated_at)
        VALUES (v_tenant_id, v_user_id, 'owner', NOW())
        ON CONFLICT (tenant_id, user_id)
        DO UPDATE SET role = 'owner', updated_at = NOW();

        -- 4. Set secure app_metadata on auth.users (requires superuser/postgres role in SQL Editor)
        UPDATE auth.users
        SET raw_app_meta_data = raw_app_meta_data || '{"role": "owner"}'::jsonb
        WHERE id = v_user_id;

        RAISE NOTICE 'SUCCESS: Granted owner role to user % (nandanvarkrish@gmail.com) for tenant %', v_user_id, v_tenant_id;
    ELSIF v_user_id IS NULL THEN
        RAISE NOTICE 'NOTICE: User nandanvarkrish@gmail.com not yet found in auth.users. Please register/create the account first, then re-run this script.';
    ELSE
        RAISE NOTICE 'WARNING: No tenant record found in public.tenants table.';
    END IF;
END $$;
```

---

### Method 2: Node.js Provisioning CLI Script

If you have administrative access to the command line and your `SUPABASE_SERVICE_ROLE_KEY`:

1. Set your `SUPABASE_SERVICE_ROLE_KEY` in your environment or temporary shell:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   ```
2. Execute the provisioning script:
   ```bash
   node scripts/provision-admin.mjs --email nandanvarkrish@gmail.com --role owner
   ```
3. The script will:
   - Verify the account exists in Supabase Auth.
   - Update `app_metadata.role = 'owner'` via the Admin API.
   - Upsert `tenant_memberships` record for the primary tenant with `role = 'owner'`.

---

### Method 3: Supabase Dashboard UI (Manual Metadata)

If preferred via the dashboard interface:
1. Go to **Authentication** -> **Users**.
2. Locate `nandanvarkrish@gmail.com`. (If the account does not exist, click **Add User** -> **Create User** with auto-confirm enabled).
3. Click on the user row, select **Raw User Data** or **Edit user**, and add:
   ```json
   "app_metadata": {
     "provider": "email",
     "providers": ["email"],
     "role": "owner"
   }
   ```
4. Save changes.

---

## 3. Account Initialization (If Account Does Not Exist Yet)

If `nandanvarkrish@gmail.com` has not yet registered:

1. **Option A (Self-Registration via Storefront):**
   - Visit `/login` on the website.
   - Switch to **Create Account**.
   - Sign up with `nandanvarkrish@gmail.com` and your preferred password.
   - Once verified, the server fallback in `src/lib/adminAuth.ts` **immediately recognizes** this email with `owner` clearance.
   - Run Method 1 (SQL) to link the database `tenant_memberships` row.

2. **Option B (Admin Creation via Supabase Console):**
   - Go to **Authentication** -> **Users** -> **Add User**.
   - Email: `nandanvarkrish@gmail.com`.
   - Toggle **Auto Confirm User** to `ON`.
   - Set a temporary password or send an invite link.

---

## 4. Verification & Operational Runbook

### Step 1: Customer Persona Verification
1. Sign in at `/login` with `nandanvarkrish@gmail.com`.
2. Browse `/shop` and select a garment variant.
3. Add item to cart and proceed to `/checkout`.
4. Confirm order calculation (pricing, taxes, shipping fee).
5. Open `/account` — verify your profile details and personal order history appear correctly.

### Step 2: Administrative Persona Verification
1. In the header bar or `/account` dashboard, click the **Studio** button, or navigate directly to `/admin`.
2. Confirm that `/admin` loads the **Atelier Command Studio** overview dashboard:
   - **Executive Analytics**: Gross sales, net revenue, average order value.
   - **Inventory Desk** (`/admin/inventory`): Variant stock levels and adjustment controls.
   - **Commissions & Orders** (`/admin/orders`): Store-wide orders, fulfillment status updates, and courier tracking number assignment.
   - **Returns & Refunds** (`/admin/returns`): Return requests review and restocking actions.
   - **Promotions & Discounts** (`/admin/discounts`): Coupon voucher generation and status toggles.

### Step 3: Security Boundary Verification
1. Open a private/incognito browser window.
2. Sign in with any ordinary customer account (e.g. `patron@example.com`).
3. Attempt to navigate directly to `/admin`.
4. Verify that access is strictly denied with the **Atelier Access Restricted** screen (403 Forbidden).
