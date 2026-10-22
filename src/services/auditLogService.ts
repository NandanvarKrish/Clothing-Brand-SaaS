import { getSupabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

// In-memory audit log for fallback / test environments
const inMemoryAuditLogs: AuditLogEntry[] = [];

/**
 * Records an immutable administrative audit log entry.
 */
export async function logAdminAction(params: {
  userId: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  const entry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    userEmail: params.userEmail,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details || {},
    ipAddress: params.ipAddress,
    createdAt: new Date().toISOString(),
  };

  // Always keep in memory for immediate audit review
  inMemoryAuditLogs.unshift(entry);
  if (inMemoryAuditLogs.length > 500) {
    inMemoryAuditLogs.pop();
  }

  // Persist to database if available
  const adminClient = createAdminClient() || getSupabase();
  if (adminClient) {
    try {
      await adminClient.from("admin_audit_logs").insert({
        user_id: params.userId,
        user_email: params.userEmail,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        details: params.details || {},
        ip_address: params.ipAddress,
        created_at: entry.createdAt,
      });
    } catch {
      // In-memory record preserved
    }
  }
}

/**
 * Retrieves recent administrative audit logs for studio compliance.
 */
export async function getRecentAuditLogs(limit: number = 20): Promise<AuditLogEntry[]> {
  const adminClient = createAdminClient() || getSupabase();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userEmail: d.user_email,
          action: d.action,
          entityType: d.entity_type,
          entityId: d.entity_id,
          details: d.details || {},
          ipAddress: d.ip_address,
          createdAt: d.created_at,
        }));
      }
    } catch {}
  }

  return inMemoryAuditLogs.slice(0, limit);
}
