import { createClient } from "@supabase/supabase-js";

/**
 * Creates an administrative, privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * WARNING: This client bypasses Row Level Security (RLS).
 * MUST ONLY be called server-side (Route Handlers, Webhooks, Background tasks).
 * Never import or invoke this in browser / client components.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: createAdminClient cannot be executed in the browser context.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
