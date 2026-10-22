export type EmailEventType =
  | "order_confirmed"
  | "payment_confirmed"
  | "payment_pending"
  | "order_processing"
  | "shipment_dispatched"
  | "order_delivered"
  | "cancellation_confirmed"
  | "return_requested"
  | "return_decision"
  | "refund_processed";

export interface EmailOrderSummary {
  orderNumber: string;
  totalAmount: number;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  items?: Array<{
    name: string;
    variantDescription?: string;
    quantity: number;
    price: number;
    lineTotal?: number;
  }>;
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface EmailPayload {
  recipientEmail: string;
  recipientName: string;
  orderNumber: string;
  eventType: EmailEventType;
  subject?: string;
  orderSummary?: EmailOrderSummary;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  decision?: "approved" | "rejected";
  notes?: string;
  refundAmount?: number;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "in_app_audit";
  idempotentReplay?: boolean;
  error?: string;
}
