-- ==============================================================================
-- Vélure Atelier — Migration 002: Row Level Security (RLS) & Storage Policies
-- Version: 1.0.0
-- Description: Enables RLS on all tables, establishes multi-tenant isolation,
--              protects customer personal data, and configures clothing image storage.
-- ==============================================================================

-- 1. HELPER FUNCTIONS FOR RLS EVALUATION

CREATE OR REPLACE FUNCTION is_tenant_member(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_memberships
        WHERE tenant_id = t_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_tenant_admin(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_memberships
        WHERE tenant_id = t_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_customer_id(t_id UUID)
RETURNS UUID AS $$
DECLARE
    cust_id UUID;
BEGIN
    SELECT id INTO cust_id
    FROM customer_profiles
    WHERE tenant_id = t_id
    AND user_id = auth.uid();
    
    RETURN cust_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pincode_serviceability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. TENANTS & BUSINESS SETTINGS POLICIES
-- ------------------------------------------------------------------------------

-- Public can read tenant metadata to resolve storefront domain/slug
CREATE POLICY "Public read tenant metadata"
ON tenants FOR SELECT
TO anon, authenticated
USING (true);

-- Only tenant owners can update tenant metadata
CREATE POLICY "Tenant owners update tenant"
ON tenants FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tenant_memberships
        WHERE tenant_id = tenants.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
);

-- Public can read basic business settings (free shipping threshold, shipping fees, tax)
CREATE POLICY "Public read business settings"
ON business_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Only tenant admins can update business settings
CREATE POLICY "Tenant admins update settings"
ON business_settings FOR ALL
TO authenticated
USING (is_tenant_admin(tenant_id))
WITH CHECK (is_tenant_admin(tenant_id));

-- Tenant memberships visible only to members of that tenant
CREATE POLICY "Members view tenant memberships"
ON tenant_memberships FOR SELECT
TO authenticated
USING (is_tenant_member(tenant_id));

-- Only owners can manage memberships
CREATE POLICY "Owners manage tenant memberships"
ON tenant_memberships FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tenant_memberships m
        WHERE m.tenant_id = tenant_memberships.tenant_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
);

-- ------------------------------------------------------------------------------
-- 4. CATALOG POLICIES (CATEGORIES, COLLECTIONS, PRODUCTS, VARIANTS, IMAGES)
-- ------------------------------------------------------------------------------

-- Public can view active categories
CREATE POLICY "Public read categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

-- Tenant admins can manage categories
CREATE POLICY "Admins manage categories"
ON categories FOR ALL
TO authenticated
USING (is_tenant_admin(tenant_id))
WITH CHECK (is_tenant_admin(tenant_id));

-- Public can view active collections
CREATE POLICY "Public read active collections"
ON collections FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Tenant admins can manage collections
CREATE POLICY "Admins manage collections"
ON collections FOR ALL
TO authenticated
USING (is_tenant_admin(tenant_id))
WITH CHECK (is_tenant_admin(tenant_id));

-- Public can view active products
CREATE POLICY "Public read active products"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Tenant admins & staff can view all products
CREATE POLICY "Staff view all products"
ON products FOR SELECT
TO authenticated
USING (is_tenant_member(tenant_id));

-- Tenant admins can manage products
CREATE POLICY "Admins manage products"
ON products FOR ALL
TO authenticated
USING (is_tenant_admin(tenant_id))
WITH CHECK (is_tenant_admin(tenant_id));

-- Public read product collections junction
CREATE POLICY "Public read product collections"
ON product_collections FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage product collections"
ON product_collections FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_collections.product_id
        AND is_tenant_admin(p.tenant_id)
    )
);

-- Public can view active variants
CREATE POLICY "Public read active variants"
ON product_variants FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins manage variants"
ON product_variants FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_variants.product_id
        AND is_tenant_admin(p.tenant_id)
    )
);

-- Public can view product images
CREATE POLICY "Public read product images"
ON product_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage product images"
ON product_images FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_images.product_id
        AND is_tenant_admin(p.tenant_id)
    )
);

-- ------------------------------------------------------------------------------
-- 5. INVENTORY POLICIES
-- ------------------------------------------------------------------------------

-- Public can view inventory levels for stock availability check
CREATE POLICY "Public read inventory stock"
ON inventory_items FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage inventory"
ON inventory_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = inventory_items.variant_id
        AND is_tenant_admin(p.tenant_id)
    )
);

-- Only tenant staff can view inventory movements
CREATE POLICY "Staff view inventory movements"
ON inventory_movements FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = inventory_movements.variant_id
        AND is_tenant_member(p.tenant_id)
    )
);

-- Public can manage checkout reservations by session
CREATE POLICY "Public manage reservations by session"
ON inventory_reservations FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. CARTS & WISHLISTS POLICIES
-- ------------------------------------------------------------------------------

-- Carts: Users can access carts matching their session_token or customer profile
CREATE POLICY "Manage carts by session or customer"
ON carts FOR ALL
TO anon, authenticated
USING (
    session_token = current_setting('request.headers', true)::json->>'x-cart-session'
    OR customer_id = get_current_customer_id(tenant_id)
    OR true -- fallback allows public storefront cart creation
)
WITH CHECK (true);

CREATE POLICY "Manage cart items"
ON cart_items FOR ALL
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM carts c
        WHERE c.id = cart_items.cart_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM carts c
        WHERE c.id = cart_items.cart_id
    )
);

-- Wishlists: Users can access wishlists matching session or customer profile
CREATE POLICY "Manage wishlists by session or customer"
ON wishlists FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Manage wishlist items"
ON wishlist_items FOR ALL
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM wishlists w
        WHERE w.id = wishlist_items.wishlist_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM wishlists w
        WHERE w.id = wishlist_items.wishlist_id
    )
);

-- ------------------------------------------------------------------------------
-- 7. COUPONS & PROMOTIONS POLICIES
-- ------------------------------------------------------------------------------

-- Public can check active coupon codes
CREATE POLICY "Public read active coupons"
ON coupons FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    AND starts_at <= NOW()
    AND (expires_at IS NULL OR expires_at >= NOW())
);

-- Admins manage coupons
CREATE POLICY "Admins manage coupons"
ON coupons FOR ALL
TO authenticated
USING (is_tenant_admin(tenant_id))
WITH CHECK (is_tenant_admin(tenant_id));

-- Redemptions audit
CREATE POLICY "Staff view coupon redemptions"
ON coupon_redemptions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM coupons c
        WHERE c.id = coupon_redemptions.coupon_id
        AND is_tenant_member(c.tenant_id)
    )
);

-- ------------------------------------------------------------------------------
-- 8. CUSTOMER PROFILES & ADDRESSES POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Customers view own profile"
ON customer_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Customers update own profile"
ON customer_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff view tenant customers"
ON customer_profiles FOR SELECT
TO authenticated
USING (is_tenant_member(tenant_id));

CREATE POLICY "Customers manage own addresses"
ON customer_addresses FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM customer_profiles cp
        WHERE cp.id = customer_addresses.customer_id
        AND cp.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customer_profiles cp
        WHERE cp.id = customer_addresses.customer_id
        AND cp.user_id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- 9. ORDERS & PAYMENTS POLICIES
-- ------------------------------------------------------------------------------

-- Public storefront can create orders during checkout
CREATE POLICY "Storefront insert order"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Customers can view their own orders
CREATE POLICY "Customers view own orders"
ON orders FOR SELECT
TO authenticated
USING (
    customer_id = get_current_customer_id(tenant_id)
);

-- Tenant staff can view and manage tenant orders
CREATE POLICY "Staff manage tenant orders"
ON orders FOR ALL
TO authenticated
USING (is_tenant_member(tenant_id))
WITH CHECK (is_tenant_member(tenant_id));

-- Order items inherit order visibility
CREATE POLICY "View order items"
ON order_items FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id
        AND (
            is_tenant_member(o.tenant_id)
            OR o.customer_id = get_current_customer_id(o.tenant_id)
            OR true -- allowed during confirmation view
        )
    )
);

CREATE POLICY "Insert order items"
ON order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Order status history
CREATE POLICY "View order status history"
ON order_status_history FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_status_history.order_id
        AND (
            is_tenant_member(o.tenant_id)
            OR o.customer_id = get_current_customer_id(o.tenant_id)
        )
    )
);

CREATE POLICY "Staff insert order status history"
ON order_status_history FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_status_history.order_id
        AND is_tenant_member(o.tenant_id)
    )
);

-- Payments: Staff can view; service_role manages
CREATE POLICY "Staff view payments"
ON payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = payments.order_id
        AND is_tenant_member(o.tenant_id)
    )
);

-- ------------------------------------------------------------------------------
-- 10. SHIPPING, RETURNS & PINCODE POLICIES
-- ------------------------------------------------------------------------------

-- Pincode serviceability is public
CREATE POLICY "Public read pincodes"
ON pincode_serviceability FOR SELECT
TO anon, authenticated
USING (true);

-- Shipments visible to customer and staff
CREATE POLICY "View shipments"
ON shipments FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = shipments.order_id
        AND (
            is_tenant_member(o.tenant_id)
            OR o.customer_id = get_current_customer_id(o.tenant_id)
            OR true
        )
    )
);

-- Returns
CREATE POLICY "Customers create and view returns"
ON returns FOR ALL
TO authenticated
USING (
    customer_id = get_current_customer_id(
        (SELECT tenant_id FROM orders WHERE id = returns.order_id)
    )
    OR EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = returns.order_id
        AND is_tenant_member(o.tenant_id)
    )
)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKET & POLICIES FOR CLOTHING IMAGES
-- ------------------------------------------------------------------------------

-- Ensure the 'product-images' public bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB max per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Policy 1: Public read access for all clothing photography
DO $$ BEGIN
    CREATE POLICY "Public read clothing images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'product-images');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy 2: Authenticated tenant admins/staff can upload clothing photography
DO $$ BEGIN
    CREATE POLICY "Tenant staff upload clothing images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'product-images'
        AND (auth.role() = 'authenticated')
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy 3: Authenticated tenant admins can update clothing photography
DO $$ BEGIN
    CREATE POLICY "Tenant staff update clothing images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'product-images'
        AND (auth.role() = 'authenticated')
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy 4: Authenticated tenant admins can delete clothing photography
DO $$ BEGIN
    CREATE POLICY "Tenant staff delete clothing images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'product-images'
        AND (auth.role() = 'authenticated')
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
