-- ==============================================================================
-- MIGRATION: 20261018000007_shipping_notifications.sql
-- DESCRIPTION: Phase 10 — Shipping architecture, notification event ledger,
--              idempotency guards, and carrier tracking indexes.
-- ==============================================================================

-- 1. Create notification_events table for deduplication and audit tracking
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(100),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'sent', 'failed'
    provider VARCHAR(50) NOT NULL DEFAULT 'resend',
    provider_message_id VARCHAR(255),
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for speedy deduplication and lookup
CREATE INDEX IF NOT EXISTS idx_notification_events_order_number 
ON notification_events (order_number);

CREATE INDEX IF NOT EXISTS idx_notification_events_recipient 
ON notification_events (recipient_email, created_at DESC);

-- Enable RLS on notification_events
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- Customers can view only notifications sent to their email
DROP POLICY IF EXISTS "Customers view own notification events" ON notification_events;
CREATE POLICY "Customers view own notification events" ON notification_events
FOR SELECT USING (
    recipient_email = auth.jwt() ->> 'email' OR
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = notification_events.order_id
        AND orders.customer_id = auth.uid()
    )
);

-- Staff and system services can insert and update notifications
DROP POLICY IF EXISTS "Staff manage notification events" ON notification_events;
CREATE POLICY "Staff manage notification events" ON notification_events
FOR ALL USING (
    auth.uid() IS NOT NULL
);

-- 2. Add unique constraint to shipments table to prevent duplicate carrier manifests
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_shipment_order_tracking'
    ) THEN
        ALTER TABLE shipments ADD CONSTRAINT uq_shipment_order_tracking UNIQUE (order_id, tracking_number);
    END IF;
END $$;

-- 3. Seed additional serviceability pincodes if table exists
INSERT INTO pincode_serviceability (pincode, city, state, estimated_delivery_days, courier, is_serviceable, cod_available)
VALUES 
    ('110001', 'New Delhi', 'Delhi', '1–2 business days', 'BlueDart Express Air', true, true),
    ('400001', 'Mumbai', 'Maharashtra', '1–2 business days', 'BlueDart Express Air', true, true),
    ('560001', 'Bengaluru', 'Karnataka', '1–2 business days', 'BlueDart Express Air', true, true),
    ('600001', 'Chennai', 'Tamil Nadu', '2–3 business days', 'BlueDart Express Air', true, true),
    ('700001', 'Kolkata', 'West Bengal', '2–3 business days', 'BlueDart Express Air', true, true),
    ('500001', 'Hyderabad', 'Telangana', '2–3 business days', 'BlueDart Express Air', true, true),
    ('380001', 'Ahmedabad', 'Gujarat', '2–3 business days', 'BlueDart Express Air', true, true),
    ('302001', 'Jaipur', 'Rajasthan', '2–3 business days', 'BlueDart Express Air', true, true)
ON CONFLICT (pincode) DO NOTHING;
