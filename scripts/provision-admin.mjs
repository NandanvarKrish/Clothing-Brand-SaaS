#!/usr/bin/env node

/**
 * VÉLURE ATELIER — Idempotent Administrator Role Provisioning CLI
 *
 * Usage:
 *   node scripts/provision-admin.mjs [--email user@example.com] [--role owner|admin]
 *
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY in environment or .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL in environment or .env.local
 *
 * Security:
 *   - Never accepts or logs passwords.
 *   - Idempotently elevates an existing authenticated user to administrator status.
 *   - Updates both Supabase Auth app_metadata and tenant_memberships table.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Load local environment files if present
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const f of envFiles) {
    const fullPath = path.resolve(process.cwd(), f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

// Parse CLI flags
const args = process.argv.slice(2);
let targetEmail = "nandanvarkrish@gmail.com";
let targetRole = "owner";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--email" && args[i + 1]) {
    targetEmail = args[i + 1].trim().toLowerCase();
    i++;
  } else if (args[i] === "--role" && args[i + 1]) {
    targetRole = args[i + 1].trim().toLowerCase();
    i++;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("===============================================================================");
console.log("VÉLURE ATELIER — ADMINISTRATOR ROLE PROVISIONING UTILITY");
console.log("===============================================================================");
console.log(`Target Email: ${targetEmail}`);
console.log(`Target Role:  ${targetRole}`);
console.log(`Supabase URL: ${supabaseUrl || "Not configured"}\n`);

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("placeholder")) {
  console.log("-------------------------------------------------------------------------------");
  console.log("NOTICE: SUPABASE_SERVICE_ROLE_KEY is required for server-side role provisioning.");
  console.log("-------------------------------------------------------------------------------");
  console.log("If running in production without local service-role credentials, execute this");
  console.log("idempotent SQL query directly in your Supabase Dashboard SQL Editor:\n");
  console.log(`-- Step 1: Assign owner role to '${targetEmail}' in tenant_memberships
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users WHERE email = '${targetEmail}';

    IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
        INSERT INTO tenant_memberships (tenant_id, user_id, role, updated_at)
        VALUES (v_tenant_id, v_user_id, '${targetRole}', NOW())
        ON CONFLICT (tenant_id, user_id)
        DO UPDATE SET role = '${targetRole}', updated_at = NOW();
        RAISE NOTICE 'Granted % role to user % for tenant %', '${targetRole}', v_user_id, v_tenant_id;
    ELSE
        RAISE NOTICE 'User % not found in auth.users. Please create account in Auth dashboard first.', '${targetEmail}';
    END IF;
END $$;
`);
  console.log("-------------------------------------------------------------------------------\n");
  process.exit(0);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function provisionAdmin() {
  console.log(`Searching for account '${targetEmail}' in Supabase Auth...`);
  
  // List users
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (listError) {
    console.error("Error connecting to Supabase Auth API:", listError.message);
    process.exit(1);
  }

  const existingUser = users.find((u) => u.email?.toLowerCase() === targetEmail);

  if (!existingUser) {
    console.log(`\n[INFO] Account '${targetEmail}' does not exist yet in Supabase Auth.`);
    console.log("\nFollow these steps to safely initialize the administrator account:");
    console.log("1. Open Supabase Dashboard -> Authentication -> Users.");
    console.log("   Click 'Add User' -> 'Create user' with:");
    console.log(`   - Email: ${targetEmail}`);
    console.log("   - Secure password (configured privately by the operator)");
    console.log("   - Auto-confirm user: Enabled");
    console.log("2. Once created, re-run this script to assign privileges:");
    console.log(`   node scripts/provision-admin.mjs --email ${targetEmail} --role ${targetRole}\n`);
    return;
  }

  console.log(`Found user ID: ${existingUser.id}`);

  // 1. Update app_metadata with role
  const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
    app_metadata: {
      ...existingUser.app_metadata,
      role: targetRole,
    },
  });

  if (updateAuthError) {
    console.error("Failed to update user app_metadata:", updateAuthError.message);
    process.exit(1);
  }
  console.log(`✓ Updated auth.users app_metadata.role = '${targetRole}'`);

  // 2. Upsert into tenant_memberships
  const { data: tenant } = await adminClient.from("tenants").select("id").limit(1).single();
  if (tenant?.id) {
    const { error: membershipError } = await adminClient
      .from("tenant_memberships")
      .upsert(
        {
          tenant_id: tenant.id,
          user_id: existingUser.id,
          role: targetRole,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,user_id" }
      );

    if (membershipError) {
      console.warn("Could not upsert tenant_memberships (table may not exist or RLS blocked):", membershipError.message);
    } else {
      console.log(`✓ Upserted tenant_memberships for tenant ${tenant.id} with role '${targetRole}'`);
    }
  }

  console.log(`\n[SUCCESS] Account '${targetEmail}' has been granted '${targetRole}' privileges.\n`);
}

provisionAdmin().catch((err) => {
  console.error("Unhandled error during admin provisioning:", err);
  process.exit(1);
});
