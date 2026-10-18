import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser / Client Components.
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null or throw clear descriptive message when unconfigured
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
