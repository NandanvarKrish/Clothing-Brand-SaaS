import { sendTransactionalEmail } from "@/services/email/emailService";
import { EmailEventType, EmailPayload } from "@/services/email/types";

export type OrderNotificationType =
  | "order_confirmed"
  | "payment_confirmed"
  | "payment_pending"
  | "tailoring_commenced"
  | "order_processing"
  | "shipment_dispatched"
  | "order_delivered"
  | "cancellation_requested"
  | "cancellation_decision"
  | "cancellation_confirmed"
  | "return_requested"
  | "return_decision"
  | "refund_processed";

export interface OrderNotificationPayload {
  orderNumber: string;
  recipientEmail: string;
  recipientName: string;
  type: OrderNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/**
 * Maps legacy or domain notification types to standardized EmailEventType.
 */
function mapToEmailEventType(type: OrderNotificationType): EmailEventType {
  switch (type) {
    case "tailoring_commenced":
      return "order_processing";
    case "cancellation_decision":
    case "cancellation_requested":
      return "cancellation_confirmed";
    default:
      return type as EmailEventType;
  }
}

/**
 * Dispatches an order milestone notification idempotently via the transactional email engine.
 */
export async function sendOrderNotification(payload: OrderNotificationPayload) {
  try {
    const emailPayload: EmailPayload = {
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      orderNumber: payload.orderNumber,
      eventType: mapToEmailEventType(payload.type),
      subject: payload.title,
      carrier: payload.metadata?.carrier,
      trackingNumber: payload.metadata?.trackingNumber,
      trackingUrl: payload.metadata?.trackingUrl,
      decision: payload.metadata?.decision,
      notes: payload.metadata?.notes || payload.message,
      refundAmount: payload.metadata?.refundAmount,
      metadata: payload.metadata,
    };

    return await sendTransactionalEmail(emailPayload);
  } catch (err: any) {
    console.warn("Failed to dispatch order notification:", err.message);
    return { success: false, error: err.message };
  }
}
