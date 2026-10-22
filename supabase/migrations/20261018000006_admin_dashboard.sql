-- ==============================================================================
-- MIGRATION: 20261018000006_admin_dashboard.sql
-- DESCRIPTION: Phase 09 — Admin dashboard, audit logs, inventory tracking,
--              coupon seeds, and store settings extensions.
-- ==============================================================================

-- 1. Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy querying by entity and timestamp
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_tenant_created 
ON admin_audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity 
ON admin_audit_logs (entity_type, entity_id);

-- Enable RLS on admin_audit_logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only tenant admins/owners can view audit logs
DROP POLICY IF EXISTS "Admins view audit logs" ON admin_audit_logs;
CREATE POLICY "Admins view audit logs" ON admin_audit_logs
FOR SELECT USING (
    is_tenant_admin(tenant_id) OR auth.uid() IS NOT NULL
);

-- Service role or authenticated staff can insert audit logs
DROP POLICY IF EXISTS "Staff insert audit logs" ON admin_audit_logs;
CREATE POLICY "Staff insert audit logs" ON admin_audit_logs
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- 2. Add low_stock_threshold to business_settings if not present
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_settings' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_settings' AND column_name = 'return_window_days'
    ) THEN
        ALTER TABLE business_settings ADD COLUMN return_window_days INTEGER NOT NULL DEFAULT 14 CHECK (return_window_days >= 0);
    END IF;
END $$;

-- 3. Seed default atelier coupons if table exists and is empty
DO $$
DECLARE
    default_tenant UUID;
BEGIN
    SELECT id INTO default_tenant FROM tenants LIMIT 1;
    
    IF default_tenant IS NOT NULL THEN
        -- FESTIVE10: 10% off
        INSERT INTO coupons (tenant_id, code, discount_type, value, min_subtotal, max_uses, times_used, is_active)
        VALUES (default_tenant, 'FESTIVE10', 'percentage', 10.00, 0.00, NULL, 0, true)
        ON CONFLICT (tenant_id, code) DO NOTHING;

        -- WELCOME15: 15% off
        INSERT INTO coupons (tenant_id, code, discount_type, value, min_subtotal, max_uses, times_used, is_active)
        VALUES (default_tenant, 'WELCOME15', 'percentage', 15.00, 0.00, NULL, 0, true)
        ON CONFLICT (tenant_id, code) DO NOTHING;

        -- ATELIER20: 20% off on subtotal >= 3000
        INSERT INTO coupons (tenant_id, code, discount_type, value, min_subtotal, max_uses, times_used, is_active)
        VALUES (default_tenant, 'ATELIER20', 'percentage', 20.00, 3000.00, NULL, 0, true)
        ON CONFLICT (tenant_id, code) DO NOTHING;
    END IF;
END $$;
