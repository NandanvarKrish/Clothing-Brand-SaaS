import crypto from 'node:crypto';
import { getSupabase } from '@/lib/supabase';
import { getOrderByNumber, updateOrderStatus, OrderRecord } from '@/services/orderService';
import { PaymentProvider, PaymentProviderType, PaymentSessionResult, PaymentVerificationResult } from './types';
import { YoupiPaymentProvider } from './youpiProvider';
import { MockPaymentProvider } from './mockProvider';

// Instantiated provider singletons
const youpiProvider = new YoupiPaymentProvider();
const mockProvider = new MockPaymentProvider();

// In-memory processed webhook deliveries (idempotency deduplication)
const processedDeliveryIds = new Set<string>();

/**
 * Resolves the active payment provider based on configuration or explicit request.
 */
export function getPaymentProvider(providerId?: string): PaymentProvider {
  const chosen = (providerId || process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();

  if (chosen === 'youpi') {
    return youpiProvider;
  }

  // Default to test sandbox mock provider
  return mockProvider;
}

/**
 * Authoritatively initiates a payment session for an existing internal order.
 * Calculates amount strictly from the trusted database order record.
 */
export async function initiatePaymentForOrder(
  orderNumber: string,
  options: {
    returnUrl?: string;
    providerId?: string;
  } = {}
): Promise<PaymentSessionResult> {
  const order = await getOrderByNumber(orderNumber);

  if (!order) {
    return {
      success: false,
      paymentId: '',
      attemptId: '',
      provider: 'unconfigured',
      checkoutUrl: '',
      status: 'failed',
      error: `Order #${orderNumber} not found in system.`,
    };
  }

  // Invariant: Do not initiate payment for already settled or cancelled orders
  if (order.paymentStatus === 'paid') {
    return {
      success: false,
      paymentId: '',
      attemptId: '',
      provider: 'unconfigured',
      checkoutUrl: '',
      status: 'failed',
      error: `Order #${orderNumber} is already paid and completed.`,
    };
  }

  if (order.fulfillmentStatus === 'cancelled') {
    return {
      success: false,
      paymentId: '',
      attemptId: '',
      provider: 'unconfigured',
      checkoutUrl: '',
      status: 'failed',
      error: `Order #${orderNumber} has been cancelled.`,
    };
  }

  const provider = getPaymentProvider(options.providerId);
  const amountPaise = Math.round(order.totalAmount * 100);
  const attemptId = `pay_att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const defaultReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-confirmation?order=${encodeURIComponent(order.orderNumber)}`;

  const customerName = order.shippingAddress?.fullName || 'Atelier Patron';
  const customerPhone = order.shippingAddress?.phone || '9999999999';
  const customerEmail = (order as any).guestEmail || (order as any).customer?.email || 'patron@example.com';

  const sessionResult = await provider.createPaymentSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
    amountPaise,
    currency: 'INR',
    customer: {
      name: customerName,
      email: customerEmail,
      phoneNumber: customerPhone,
    },
    returnUrl: options.returnUrl || defaultReturnUrl,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      attemptId,
    },
    idempotencyKey: `idem_${order.orderNumber}_${attemptId}`,
  });

  if (sessionResult.success) {
    // Record payment attempt on order record
    await updateOrderStatus(order.orderNumber, {
      paymentStatus: 'pending',
      paymentAttempt: {
        attemptId,
        provider: provider.id,
        paymentId: sessionResult.paymentId,
        status: sessionResult.status,
        amountPaise,
        initiatedAt: new Date().toISOString(),
      },
    });

    // Attempt recording in Supabase payments table
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('payments').insert({
          order_id: order.id,
          gateway: provider.id,
          transaction_id: sessionResult.paymentId,
          amount: order.totalAmount,
          currency: 'INR',
          status: 'pending',
          gateway_response: sessionResult.rawResponse || {},
        });
      } catch (err) {
        console.warn('Could not insert remote payment record:', err);
      }
    }
  }

  return sessionResult;
}

export interface ProcessWebhookResult {
  success: boolean;
  httpStatus: number;
  duplicate?: boolean;
  orderNumber?: string;
  event?: string;
  newStatus?: string;
  error?: string;
  code?: string;
}

/**
 * Authoritatively processes an incoming payment webhook.
 * - Enforces constant-time raw-body HMAC verification
 * - Deduplicates events
 * - Verifies order details, amounts, and currencies
 * - Atomically transitions order and payment state
 */
export async function processPaymentWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  providerId?: string
): Promise<ProcessWebhookResult> {
  const provider = getPaymentProvider(providerId);

  // 1. Signature Verification over Raw Body
  const verification: PaymentVerificationResult = provider.verifyWebhook(rawBody, headers);

  if (!verification.isValid) {
    return {
      success: false,
      httpStatus: 401,
      error: verification.error || 'Invalid webhook signature',
      code: 'UNAUTHORIZED_SIGNATURE',
    };
  }

  // 2. Deduplication & Idempotency Check
  const rawDeliveryId = headers['x-gateway-delivery-id'] || headers['X-Gateway-Delivery-Id'];
  const deliveryId = (Array.isArray(rawDeliveryId) ? rawDeliveryId[0] : rawDeliveryId) ||
    `${verification.paymentId}_${verification.event}`;

  if (processedDeliveryIds.has(deliveryId)) {
    return {
      success: true,
      httpStatus: 200,
      duplicate: true,
      orderNumber: verification.orderId,
      event: verification.event,
    };
  }

  // 3. Match Order to Internal State
  const order = await getOrderByNumber(verification.orderId);
  if (!order) {
    return {
      success: false,
      httpStatus: 404,
      error: `Order ${verification.orderId} not found.`,
      code: 'ORDER_NOT_FOUND',
    };
  }

  // 4. Amount & Currency Verification (Anti-Tampering)
  const expectedAmountPaise = Math.round(order.totalAmount * 100);
  if (verification.amountPaise !== expectedAmountPaise) {
    console.error(
      `SECURITY ALERT: Payment amount mismatch for order ${order.orderNumber}. Expected ${expectedAmountPaise} paise, received ${verification.amountPaise} paise.`
    );
    return {
      success: false,
      httpStatus: 400,
      error: 'Payment amount does not match internal order total.',
      code: 'AMOUNT_MISMATCH',
    };
  }

  if (verification.currency && verification.currency.toUpperCase() !== 'INR') {
    return {
      success: false,
      httpStatus: 400,
      error: 'Invalid currency. Expected INR.',
      code: 'CURRENCY_MISMATCH',
    };
  }

  // 5. Idempotent Transition Check
  if (order.paymentStatus === 'paid' && verification.event === 'SUCCESS') {
    // Already marked paid by earlier webhook or race condition
    processedDeliveryIds.add(deliveryId);
    return {
      success: true,
      httpStatus: 200,
      duplicate: true,
      orderNumber: order.orderNumber,
      event: verification.event,
      newStatus: 'paid',
    };
  }

  // 6. State Machine Transitions
  let newPaymentStatus: OrderRecord['paymentStatus'] = order.paymentStatus;
  let newFulfillmentStatus: OrderRecord['fulfillmentStatus'] = order.fulfillmentStatus;

  switch (verification.event) {
    case 'SUCCESS':
      newPaymentStatus = 'paid';
      // If prepaid, confirm fulfillment for tailoring upon verified capture
      newFulfillmentStatus = 'confirmed';
      break;

    case 'FAILED':
      newPaymentStatus = 'failed';
      break;

    case 'EXPIRED':
      newPaymentStatus = 'failed';
      break;

    case 'CANCELLED':
      newPaymentStatus = 'failed';
      newFulfillmentStatus = 'cancelled';
      break;

    default:
      console.warn(`Unrecognized webhook event: ${verification.event}`);
      break;
  }

  // Update order record
  const updated = await updateOrderStatus(order.orderNumber, {
    paymentStatus: newPaymentStatus,
    fulfillmentStatus: newFulfillmentStatus,
    bankReferenceNumber: verification.utr,
  });

  // Log in Supabase payment_events table
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('payment_events').insert({
        gateway: provider.id,
        event_id: deliveryId,
        event_type: verification.event,
        payload: {
          paymentId: verification.paymentId,
          orderId: verification.orderId,
          amountPaise: verification.amountPaise,
          utr: verification.utr,
        },
        processed: true,
      });

      // Update payments row status
      await supabase
        .from('payments')
        .update({
          status: newPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_id', verification.paymentId);
    } catch (err) {
      console.warn('Could not record remote payment event:', err);
    }
  }

  // Mark delivery processed
  processedDeliveryIds.add(deliveryId);

  return {
    success: true,
    httpStatus: 200,
    orderNumber: order.orderNumber,
    event: verification.event,
    newStatus: updated?.paymentStatus || newPaymentStatus,
  };
}

/**
 * Accessor for the mock provider (used for test simulation scripts).
 */
export function getMockPaymentProvider(): MockPaymentProvider {
  return mockProvider;
}
