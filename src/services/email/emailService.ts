import { getSupabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmailPayload, EmailResult } from "./types";
import { buildEmailTemplate } from "./templates";

// In-memory ledger for test runner and offline environments
const inMemoryEvents = new Map<string, { id: string; payload: EmailPayload; status: string; messageId?: string }>();

/**
 * Computes a deterministic idempotency key for an order event.
 */
export function computeNotificationIdempotencyKey(payload: EmailPayload): string {
  if (payload.idempotencyKey) {
    return payload.idempotencyKey;
  }
  const modifier = payload.decision || payload.trackingNumber || payload.refundAmount || "";
  return `${payload.eventType}_${payload.orderNumber}_${modifier}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Sends a transactional customer email with deduplication, template compilation,
 * and resilient provider dispatch.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<EmailResult> {
  const idempotencyKey = computeNotificationIdempotencyKey(payload);

  // 1. Check in-memory store for idempotency
  const cached = inMemoryEvents.get(idempotencyKey);
  if (cached && cached.status === "sent") {
    return {
      success: true,
      idempotentReplay: true,
      provider: "in_app_audit",
      messageId: cached.messageId,
    };
  }

  // 2. Check Supabase notification_events table
  const supabase = createAdminClient() || getSupabase();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("notification_events")
        .select("id, status, provider_message_id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing && existing.status === "sent") {
        return {
          success: true,
          idempotentReplay: true,
          provider: "resend",
          messageId: existing.provider_message_id,
        };
      }
    } catch {
      // In-memory fallback
    }
  }

  // 3. Compile brand HTML and plain-text templates
  const { subject, html, text } = buildEmailTemplate(payload);

  // 4. Determine dispatch provider
  const apiKey = process.env.RESEND_API_KEY;
  const isRealResendConfigured =
    apiKey &&
    apiKey.startsWith("re_") &&
    !apiKey.includes("placeholder") &&
    process.env.NODE_ENV !== "test";

  let messageId = `msg_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let providerUsed: "resend" | "in_app_audit" = "in_app_audit";

  if (isRealResendConfigured) {
    providerUsed = "resend";
    try {
      const fromAddress = process.env.EMAIL_FROM || "Vélure Atelier <concierge@velure-atelier.com>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [payload.recipientEmail],
          subject,
          html,
          text,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Resend API Error (${res.status}): ${errorText}`);
      }

      const resData = await res.json();
      messageId = resData.id || messageId;
    } catch (err: any) {
      // Record failure without crashing caller
      console.warn(`[NOTIF-FAIL] ${payload.eventType} for #${payload.orderNumber}:`, err.message);

      if (supabase) {
        try {
          await supabase.from("notification_events").upsert(
            {
              idempotency_key: idempotencyKey,
              order_number: payload.orderNumber,
              recipient_email: payload.recipientEmail,
              recipient_name: payload.recipientName,
              event_type: payload.eventType,
              subject,
              status: "failed",
              provider: "resend",
              error_message: err.message,
              metadata: payload.metadata || {},
            },
            { onConflict: "idempotency_key" }
          );
        } catch {}
      }

      return {
        success: false,
        provider: "resend",
        error: err.message,
      };
    }
  }

  // 5. Record successful notification event
  inMemoryEvents.set(idempotencyKey, {
    id: `ev_${Date.now()}`,
    payload,
    status: "sent",
    messageId,
  });

  if (supabase) {
    try {
      await supabase.from("notification_events").upsert(
        {
          idempotency_key: idempotencyKey,
          order_number: payload.orderNumber,
          recipient_email: payload.recipientEmail,
          recipient_name: payload.recipientName,
          event_type: payload.eventType,
          subject,
          status: "sent",
          provider: providerUsed,
          provider_message_id: messageId,
          sent_at: new Date().toISOString(),
          metadata: payload.metadata || {},
        },
        { onConflict: "idempotency_key" }
      );
    } catch {}
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[EMAIL-DISPATCH] (${providerUsed}) ${payload.eventType} for Order #${payload.orderNumber} -> ${payload.recipientEmail} [id: ${messageId}]`
    );
  }

  return {
    success: true,
    provider: providerUsed,
    messageId,
  };
}

/**
 * Retrieves the in-memory event dispatch log for testing.
 */
export function getNotificationHistory(): Array<{ key: string; payload: EmailPayload; status: string }> {
  return Array.from(inMemoryEvents.entries()).map(([key, val]) => ({
    key,
    payload: val.payload,
    status: val.status,
  }));
}

/**
 * Clears the in-memory event history.
 */
export function clearNotificationHistory(): void {
  inMemoryEvents.clear();
}
