-- ==============================================================================
-- MIGRATION: 20261018000005_order_lifecycle.sql
-- DESCRIPTION: Phase 08 — Order lifecycle extensions, cancellation audit fields,
--              return management, tracking links, and enhanced RLS policies.
-- ==============================================================================

-- 1. EXTEND ORDER_STATUS ENUM VALUES IF NOT PRESENT
DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipped';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancellation_requested';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_requested';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. EXTEND PAYMENT_STATUS ENUM VALUES IF NOT PRESENT
DO $$ BEGIN
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'paid';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. EXTEND ORDERS TABLE WITH AUDIT & TRACKING FIELDS
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_review_notes TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 4. EXTEND RETURNS TABLE WITH RESOLUTION & AUDIT FIELDS
ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS resolution_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- 5. PERFORMANCE INDEXES FOR LIFECYCLE QUERIES
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders (fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns (order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns (status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history (order_id, created_at DESC);

-- 6. ENHANCED RLS POLICIES FOR RETURNS & STATUS HISTORY
DO $$ BEGIN
    -- Policy for customers viewing their own returns
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'returns' AND policyname = 'Customers view own returns'
    ) THEN
        CREATE POLICY "Customers view own returns"
        ON returns FOR SELECT
        TO authenticated
        USING (
            customer_id = (SELECT id FROM customer_profiles WHERE user_id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM orders o
                JOIN customer_profiles cp ON cp.id = o.customer_id
                WHERE o.id = returns.order_id AND cp.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$ BEGIN
    -- Policy for customers requesting returns on their own orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'returns' AND policyname = 'Customers request own returns'
    ) THEN
        CREATE POLICY "Customers request own returns"
        ON returns FOR INSERT
        TO authenticated
        WITH CHECK (
            customer_id = (SELECT id FROM customer_profiles WHERE user_id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM orders o
                JOIN customer_profiles cp ON cp.id = o.customer_id
                WHERE o.id = returns.order_id AND cp.user_id = auth.uid()
            )
        );
    END IF;
END $$;
