import crypto from 'node:crypto';
import {
  PaymentProvider,
  PaymentSessionInitRequest,
  PaymentSessionResult,
  PaymentVerificationResult,
  WebhookEventPayload,
} from './types';

/**
 * Isolated development adapter for the experimental YouPI PG V2 Gateway.
 *
 * CRITICAL SAFETY NOTICE:
 * This provider represents an experimental research software model that relies on
 * heuristic bank SMS/email observation rather than regulated banking rails.
 * It is strictly prohibited from running live in production environments.
 */
export class YoupiPaymentProvider implements PaymentProvider {
  public readonly id = 'youpi' as const;
  public readonly name = 'YouPI PG V2 (Experimental Development Adapter)';
  public readonly isProductionReady = false;
  public readonly supportsRefunds = false;

  private apiUrl: string;
  private merchantId: string;
  private webhookSecret: string;

  constructor() {
    this.apiUrl = (process.env.YOUPI_API_URL || 'http://localhost:6100').replace(/\/+$/, '');
    this.merchantId = process.env.YOUPI_MERCHANT_ID || '00000000-0000-0000-0000-000000000001';
    this.webhookSecret = process.env.YOUPI_WEBHOOK_SECRET || '';
  }

  /**
   * Enforces strict production safety guard.
   */
  private assertSafeExecutionEnvironment(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowTestInProd = process.env.ALLOW_TEST_PAYMENTS === 'true';

    if (isProduction && !allowTestInProd) {
      throw new Error(
        'SECURITY EXCEPTION: YOUPI PG V2 is an experimental research project and cannot be activated in production without certified payment aggregator rails. Live payments are disabled.'
      );
    }
  }

  /**
   * Creates a payment session with the YouPI payment core.
   */
  public async createPaymentSession(params: PaymentSessionInitRequest): Promise<PaymentSessionResult> {
    this.assertSafeExecutionEnvironment();

    const url = `${this.apiUrl}/api/v1/payments`;
    const attemptId = `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Merchant-Id': this.merchantId,
    };

    if (this.webhookSecret) {
      headers['X-Merchant-Key'] = this.webhookSecret;
    }

    if (params.idempotencyKey) {
      headers['Idempotency-Key'] = params.idempotencyKey;
    }

    const payload = {
      orderId: params.orderNumber,
      amount: (params.amountPaise / 100).toFixed(2),
      currency: params.currency || 'INR',
      returnUrl: params.returnUrl,
      customer: {
        name: params.customer.name,
        email: params.customer.email,
        phoneNumber: params.customer.phoneNumber,
      },
      metadata: {
        ...params.metadata,
        internalOrderId: params.orderId,
        paymentAttemptId: attemptId,
      },
      // In development test suites, allow immediate activation without manual WhatsApp step
      autoActivate: process.env.NODE_ENV === 'test' || process.env.YOUPI_AUTO_ACTIVATE === 'true',
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          paymentId: '',
          attemptId,
          provider: this.id,
          checkoutUrl: '',
          status: 'failed',
          error: `YouPI gateway rejected session [HTTP ${res.status}]: ${errorText}`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        paymentId: data.paymentId,
        attemptId,
        provider: this.id,
        checkoutUrl: data.checkoutUrl,
        status: (data.status?.toLowerCase() as any) || 'initiated',
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        paymentId: '',
        attemptId,
        provider: this.id,
        checkoutUrl: '',
        status: 'failed',
        error: `Could not connect to YouPI gateway at ${this.apiUrl}: ${err.message}`,
      };
    }
  }

  /**
   * Retrieves current payment status from YouPI core API.
   */
  public async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amountPaise?: number;
    completedAt?: string;
    raw?: any;
  }> {
    const url = `${this.apiUrl}/api/v1/payments/${encodeURIComponent(paymentId)}`;
    const headers: Record<string, string> = {};

    if (this.webhookSecret) {
      headers['X-Merchant-Key'] = this.webhookSecret;
    }

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed to query payment status [HTTP ${res.status}]`);
      }
      const data = await res.json();
      return {
        status: data.status,
        amountPaise: data.amountPaise ? Number(data.amountPaise) : undefined,
        completedAt: data.completedAt,
        raw: data,
      };
    } catch (err: any) {
      return {
        status: 'UNKNOWN',
        raw: { error: err.message },
      };
    }
  }

  /**
   * Verifies an inbound webhook using constant-time HMAC-SHA256 comparison.
   * Consumer MUST pass the raw unparsed body string.
   */
  public verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): PaymentVerificationResult {
    const signatureHeader =
      headers['x-gateway-signature'] ||
      headers['X-Gateway-Signature'] ||
      '';

    const sigStr = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!sigStr || !sigStr.startsWith('sha256=')) {
      return {
        isValid: false,
        event: 'UNKNOWN',
        paymentId: '',
        orderId: '',
        amount: '0.00',
        amountPaise: 0,
        currency: 'INR',
        method: 'UPI',
        error: 'Missing or malformed X-Gateway-Signature header (expected sha256=...)',
      };
    }

    const secret = this.webhookSecret;
    if (!secret) {
      return {
        isValid: false,
        event: 'UNKNOWN',
        paymentId: '',
        orderId: '',
        amount: '0.00',
        amountPaise: 0,
        currency: 'INR',
        method: 'UPI',
        error: 'Server webhook secret is not configured in environment (YOUPI_WEBHOOK_SECRET)',
      };
    }

    const actualHash = sigStr.replace('sha256=', '').trim();
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const actualBuffer = Buffer.from(actualHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
      return {
        isValid: false,
        event: 'UNKNOWN',
        paymentId: '',
        orderId: '',
        amount: '0.00',
        amountPaise: 0,
        currency: 'INR',
        method: 'UPI',
        error: 'Cryptographic signature mismatch. Webhook rejected.',
      };
    }

    let payload: WebhookEventPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return {
        isValid: false,
        event: 'UNKNOWN',
        paymentId: '',
        orderId: '',
        amount: '0.00',
        amountPaise: 0,
        currency: 'INR',
        method: 'UPI',
        error: 'Webhook payload contains invalid JSON.',
      };
    }

    if (!payload.event || !payload.paymentId || !payload.orderId) {
      return {
        isValid: false,
        event: 'UNKNOWN',
        paymentId: payload.paymentId || '',
        orderId: payload.orderId || '',
        amount: payload.amount || '0.00',
        amountPaise: payload.amountPaise || 0,
        currency: payload.currency || 'INR',
        method: payload.method || 'UPI',
        error: 'Webhook payload missing required contract fields (event, paymentId, orderId).',
      };
    }

    const eventOutcome = (['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(payload.event)
      ? payload.event
      : 'UNKNOWN') as PaymentVerificationResult['event'];

    return {
      isValid: true,
      event: eventOutcome,
      paymentId: payload.paymentId,
      orderId: payload.orderId,
      amount: payload.amount,
      amountPaise: Number(payload.amountPaise),
      currency: payload.currency || 'INR',
      method: payload.method || 'UPI',
      utr: payload.utr,
      completedAt: payload.completedAt,
      metadata: payload.metadata,
    };
  }
}
