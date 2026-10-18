import { createClient as createBrowserSupabaseClient } from "./supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";

export { createBrowserSupabaseClient };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client if configured, otherwise returns null.
 * Provides backwards-compatible access for existing services.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createBrowserSupabaseClient();
      if (client) {
        supabaseInstance = client;
        return supabaseInstance;
      }
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  }

  return null;
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
