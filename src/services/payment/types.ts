/**
 * Vélure Atelier — Payment Gateway Provider Types & Contracts
 * Phase 07: Isolated Evaluation & Multi-Provider Architecture
 */

export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'cod';

export type PaymentProviderType = 'youpi' | 'mock' | 'unconfigured';

export type InternalPaymentStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_pending'
  | 'refunded';

export interface PaymentCustomerDetails {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface PaymentSessionInitRequest {
  orderId: string;
  orderNumber: string;
  amount: number; // In standard INR (Rupees)
  amountPaise: number; // In integer Paise (e.g. 49900)
  currency: string; // 'INR'
  customer: PaymentCustomerDetails;
  returnUrl: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface PaymentSessionResult {
  success: boolean;
  paymentId: string;
  attemptId: string;
  provider: PaymentProviderType;
  checkoutUrl: string;
  status: 'initiated' | 'active' | 'queued' | 'pending' | 'failed';
  error?: string;
  rawResponse?: Record<string, any>;
}

export interface WebhookEventPayload {
  event: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;
  paymentId: string;
  orderId: string;
  attemptId?: string;
  amount: string; // e.g. "499.00"
  amountPaise: number; // e.g. 49900
  currency: string; // 'INR'
  method?: string; // 'UPI'
  utr?: string; // 12-digit bank reference number
  verificationTag?: string;
  verificationLevel?: number;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  event: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'UNKNOWN';
  paymentId: string;
  orderId: string;
  amount: string;
  amountPaise: number;
  currency: string;
  method: string;
  utr?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Universal payment provider contract.
 * Any payment gateway (YouPI, Razorpay, Cashfree, Stripe) must implement this interface.
 */
export interface PaymentProvider {
  id: PaymentProviderType;
  name: string;
  isProductionReady: boolean;
  supportsRefunds: boolean;

  /**
   * Initializes a payment session for an internal order.
   */
  createPaymentSession(params: PaymentSessionInitRequest): Promise<PaymentSessionResult>;

  /**
   * Queries payment status directly from the gateway.
   */
  getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amountPaise?: number;
    completedAt?: string;
    raw?: any;
  }>;

  /**
   * Cryptographically verifies an incoming raw webhook body against signature headers.
   */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): PaymentVerificationResult;
}
