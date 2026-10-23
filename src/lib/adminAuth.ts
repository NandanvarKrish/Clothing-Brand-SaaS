import { createClient as createServerClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

export interface AdminAuthResult {
  authorized: boolean;
  user: User | null;
  role?: "owner" | "admin" | "staff";
  reason?: "UNAUTHENTICATED" | "FORBIDDEN" | "NO_CONNECTION";
  error?: string;
}

/**
 * Checks if an email address is listed in the authorized admin emails whitelist.
 */
function isWhitelistedAdminEmail(email?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // Environment variable override
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.toLowerCase().split(",").map((e) => e.trim())
    : [];

  if (envAdmins.includes(cleanEmail)) {
    return true;
  }

  // Designated store owner administrator account
  if (cleanEmail === "nandanvarkrish@gmail.com") {
    return true;
  }

  // In production, heuristic email patterns are strictly disabled
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  // Common atelier concierge emails in dev/test
  if (
    cleanEmail.startsWith("admin@") ||
    cleanEmail.endsWith("@velure.atelier") ||
    cleanEmail.includes("+admin@") ||
    cleanEmail === "concierge@velureatelier.com" ||
    cleanEmail === "staff@velureatelier.com"
  ) {
    return true;
  }

  return false;
}

/**
 * Verifies whether the current user session possesses administrative privileges.
 * Strictly verifies against tenant_memberships, JWT app_metadata, and secure whitelist.
 */
export async function getAdminSession(): Promise<AdminAuthResult> {
  const supabase = await createServerClient();
  if (!supabase) {
    return {
      authorized: false,
      user: null,
      reason: "NO_CONNECTION",
      error: "Database connection unavailable.",
    };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        authorized: false,
        user: null,
        reason: "UNAUTHENTICATED",
        error: "Session required to access atelier management.",
      };
    }

    // 1. Check secure Supabase JWT app_metadata / user_metadata
    const appRole = user.app_metadata?.role;
    const userRole = user.user_metadata?.role;
    if (appRole === "admin" || appRole === "owner" || userRole === "admin" || userRole === "owner") {
      return {
        authorized: true,
        user,
        role: (appRole || userRole) as "owner" | "admin",
      };
    }

    // 2. Query tenant_memberships table
    try {
      const { data: membership, error: memError } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .maybeSingle();

      if (!memError && membership?.role) {
        return {
          authorized: true,
          user,
          role: membership.role as "owner" | "admin",
        };
      }
    } catch {
      // Fall through to whitelist check if table not reachable
    }

    // 3. Fallback to server-side email whitelist
    if (isWhitelistedAdminEmail(user.email)) {
      const isOwner = user.email?.toLowerCase().trim() === "nandanvarkrish@gmail.com";
      return {
        authorized: true,
        user,
        role: isOwner ? "owner" : "admin",
      };
    }

    return {
      authorized: false,
      user,
      reason: "FORBIDDEN",
      error: "Access denied: Staff or Administrator privileges required.",
    };
  } catch (err: any) {
    return {
      authorized: false,
      user: null,
      reason: "UNAUTHENTICATED",
      error: err.message || "Failed to authenticate administrator session.",
    };
  }
}

/**
 * Asserts that the caller is an authorized administrator. Throws an error if unauthorized.
 * Used at the top of privileged Server Actions and API routes.
 */
export async function assertAdminUser(): Promise<{ user: User; role: "owner" | "admin" | "staff" }> {
  const auth = await getAdminSession();
  if (!auth.authorized || !auth.user) {
    throw new Error(auth.error || "Unauthorized administrative access.");
  }
  return { user: auth.user, role: auth.role || "admin" };
}
