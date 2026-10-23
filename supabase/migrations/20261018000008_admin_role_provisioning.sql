-- ==============================================================================
-- MIGRATION: 20261018000008_admin_role_provisioning.sql
-- DESCRIPTION: Idempotent role elevation for administrator nandanvarkrish@gmail.com
-- ==============================================================================

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
    END IF;
END $$;
