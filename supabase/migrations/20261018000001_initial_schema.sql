-- ==============================================================================
-- Vélure Atelier — Migration 001: Initial Relational Database Schema
-- Version: 1.0.0
-- Description: Core schema for multi-tenant clothing brand SaaS, customer profiles,
--              catalog, inventory ledger, carts, orders, payments, shipping, and returns.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'confirmed',
        'tailoring',
        'inspection',
        'dispatched',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'authorized',
        'captured',
        'failed',
        'refunded',
        'partially_refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'upi',
        'card',
        'netbanking',
        'cod'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM (
        'percentage',
        'fixed_amount'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_movement_type AS ENUM (
        'sale',
        'restock',
        'manual_adjustment',
        'return_restock',
        'damaged_writeoff',
        'reservation_hold',
        'reservation_release'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE return_status AS ENUM (
        'requested',
        'approved',
        'in_transit',
        'received_at_atelier',
        'inspected_passed',
        'inspected_failed',
        'refunded',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TIMESTAMP UPDATE FUNCTION
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. TENANTS & BUSINESS SETTINGS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255) UNIQUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_tenants
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    support_email VARCHAR(255) NOT NULL,
    support_phone VARCHAR(50),
    free_shipping_threshold NUMERIC(12, 2) NOT NULL DEFAULT 1999.00 CHECK (free_shipping_threshold >= 0),
    standard_shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 250.00 CHECK (standard_shipping_fee >= 0),
    cod_handling_fee NUMERIC(12, 2) NOT NULL DEFAULT 100.00 CHECK (cod_handling_fee >= 0),
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 12.00 CHECK (tax_rate_percent >= 0),
    cod_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_settings UNIQUE (tenant_id)
);

CREATE TRIGGER set_timestamp_business_settings
BEFORE UPDATE ON business_settings
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id)
    role user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE TRIGGER set_timestamp_tenant_memberships
BEFORE UPDATE ON tenant_memberships
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 5. CUSTOMER PROFILES & ADDRESSES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE, -- references auth.users(id) when signed up
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_customer_email UNIQUE (tenant_id, email)
);

CREATE TRIGGER set_timestamp_customer_profiles
BEFORE UPDATE ON customer_profiles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_customer_addresses
BEFORE UPDATE ON customer_addresses
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 6. CATALOG: CATEGORIES, COLLECTIONS, PRODUCTS, VARIANTS & IMAGES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_category_slug UNIQUE (tenant_id, slug)
);

CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    edition_badge VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_collection_slug UNIQUE (tenant_id, slug)
);

CREATE TRIGGER set_timestamp_collections
BEFORE UPDATE ON collections
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT NOT NULL,
    fabric VARCHAR(255) NOT NULL,
    fabric_origin VARCHAR(255),
    weave_technique VARCHAR(255),
    gsm INTEGER CHECK (gsm > 0),
    edition VARCHAR(100),
    badge VARCHAR(100),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price >= price),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    details JSONB NOT NULL DEFAULT '[]'::jsonb,
    care JSONB NOT NULL DEFAULT '[]'::jsonb,
    shipping_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_product_slug UNIQUE (tenant_id, slug)
);

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS product_collections (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    size VARCHAR(20) NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(20) NOT NULL,
    price_override NUMERIC(12, 2) CHECK (price_override >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_size_color UNIQUE (product_id, size, color_name)
);

CREATE TRIGGER set_timestamp_product_variants
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    label VARCHAR(50) DEFAULT 'Front' CHECK (label IN ('Front', 'Back', 'Detail', 'Lookbook', 'Gallery')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. INVENTORY MANAGEMENT & AUDIT MOVEMENTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE UNIQUE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_inventory_items
BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    movement_type inventory_movement_type NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'return', 'manual_adjustment', 'stock_intake'
    reference_id VARCHAR(100),
    notes TEXT,
    created_by UUID, -- references auth.users(id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    session_id VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. SHOPPING CARTS & WISHLISTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(100) NOT NULL,
    coupon_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_cart_session UNIQUE (tenant_id, session_token)
);

CREATE TRIGGER set_timestamp_carts
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id)
);

CREATE TRIGGER set_timestamp_cart_items
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_wishlist_session UNIQUE (tenant_id, session_token)
);

CREATE TRIGGER set_timestamp_wishlists
BEFORE UPDATE ON wishlists
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_product UNIQUE (wishlist_id, product_id)
);

-- ------------------------------------------------------------------------------
-- 9. COUPONS & PROMOTIONAL DISCOUNTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_type discount_type NOT NULL,
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0),
    min_subtotal NUMERIC(12, 2) DEFAULT 0.00 CHECK (min_subtotal >= 0),
    max_uses INTEGER DEFAULT NULL CHECK (max_uses IS NULL OR max_uses > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_coupon_code UNIQUE (tenant_id, code)
);

CREATE TRIGGER set_timestamp_coupons
BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    order_id UUID NOT NULL, -- references orders(id)
    discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. ORDERS, ORDER ITEMS & STATUS AUDIT
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'storefront' CHECK (channel IN ('storefront', 'instagram', 'whatsapp', 'phone', 'in_person')),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    coupon_code VARCHAR(50),
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    fulfillment_status order_status NOT NULL DEFAULT 'confirmed',
    shipping_address JSONB NOT NULL,
    delivery_notes TEXT,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100) DEFAULT 'BlueDart Express Air',
    estimated_delivery VARCHAR(100) DEFAULT '2–3 business days via BlueDart Express Air',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_description VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    notes TEXT,
    changed_by UUID, -- references auth.users(id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. PAYMENTS & WEBHOOK AUDIT EVENTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'stripe', 'cashfree', 'cod'
    transaction_id VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    gateway_response JSONB, -- Safe non-sensitive metadata (NO CARD NUMBERS OR CVV)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gateway_event UNIQUE (gateway, event_id)
);

-- ------------------------------------------------------------------------------
-- 12. SHIPPING & PINCODE SERVICEABILITY
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pincode_serviceability (
    pincode VARCHAR(6) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    estimated_delivery_days VARCHAR(50) NOT NULL DEFAULT '2–3 business days',
    courier VARCHAR(100) NOT NULL DEFAULT 'BlueDart Express Air',
    is_serviceable BOOLEAN NOT NULL DEFAULT true,
    cod_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(100) NOT NULL DEFAULT 'BlueDart Express Air',
    tracking_number VARCHAR(100) NOT NULL,
    tracking_url TEXT,
    shipping_status VARCHAR(50) NOT NULL DEFAULT 'manifested',
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_shipments
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 13. RETURNS & REFUNDS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
    return_number VARCHAR(100) NOT NULL UNIQUE,
    status return_status NOT NULL DEFAULT 'requested',
    reason VARCHAR(100) NOT NULL,
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_returns
BEFORE UPDATE ON returns
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition VARCHAR(50) DEFAULT 'unopened', -- 'unopened', 'tried_on', 'damaged'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    gateway_refund_id VARCHAR(255),
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_tenant_slug ON products (tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (tenant_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products (tenant_id, is_bestseller) WHERE is_bestseller = true;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products (tenant_id, is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_images_product_order ON product_images (product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory_items (variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_session_expiry ON inventory_reservations (session_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items (wishlist_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_number ON orders (tenant_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_gateway_event ON payment_events (gateway, event_id);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant_code ON coupons (tenant_id, code);
