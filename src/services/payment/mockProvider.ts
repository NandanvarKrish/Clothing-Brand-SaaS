import crypto from 'node:crypto';
import {
  PaymentProvider,
  PaymentSessionInitRequest,
  PaymentSessionResult,
  PaymentVerificationResult,
  WebhookEventPayload,
} from './types';

/**
 * Deterministic Test Sandbox Payment Provider.
 * Allows safe verification of payment flows, webhook ingestion, and order transitions
 * without making external network calls or executing uncertified scraping software.
 */
export class MockPaymentProvider implements PaymentProvider {
  public readonly id = 'mock' as const;
  public readonly name = 'Atelier Mock Sandbox (Test-Only Adapter)';
  public readonly isProductionReady = false;
  public readonly supportsRefunds = true; // Supports simulated refunds in sandbox

  private sessions = new Map<string, any>();
  private secret: string;

  constructor(customSecret?: string) {
    this.secret = customSecret || process.env.MOCK_WEBHOOK_SECRET || 'atelier_test_mock_webhook_secret_key_32c';
  }

  public async createPaymentSession(params: PaymentSessionInitRequest): Promise<PaymentSessionResult> {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_PAYMENTS !== 'true') {
      throw new Error('SECURITY EXCEPTION: Test sandbox cannot process payments in production.');
    }

    const paymentId = `mock_pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const attemptId = `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const sessionData = {
      paymentId,
      attemptId,
      orderId: params.orderNumber,
      internalOrderId: params.orderId,
      amountPaise: params.amountPaise,
      amount: (params.amountPaise / 100).toFixed(2),
      currency: params.currency || 'INR',
      status: 'INITIATED',
      customer: params.customer,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(paymentId, sessionData);

    return {
      success: true,
      paymentId,
      attemptId,
      provider: this.id,
      checkoutUrl: `/checkout/mock-gateway?session=${encodeURIComponent(paymentId)}&order=${encodeURIComponent(params.orderNumber)}`,
      status: 'initiated',
      rawResponse: sessionData,
    };
  }

  public async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amountPaise?: number;
    completedAt?: string;
    raw?: any;
  }> {
    const session = this.sessions.get(paymentId);
    if (!session) {
      return { status: 'NOT_FOUND' };
    }
    return {
      status: session.status,
      amountPaise: session.amountPaise,
      completedAt: session.completedAt,
      raw: session,
    };
  }

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

    const actualHash = sigStr.replace('sha256=', '').trim();
    const expectedHash = crypto
      .createHmac('sha256', this.secret)
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
        error: 'Invalid JSON payload.',
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
      utr: payload.utr || 'MOCK-UTR-999888',
      completedAt: payload.completedAt || new Date().toISOString(),
      metadata: payload.metadata,
    };
  }

  /**
   * Helper utility for unit tests to construct valid signed webhook fixtures.
   */
  public generateSignedWebhookFixture(
    payload: WebhookEventPayload,
    secretOverride?: string
  ): { rawBody: string; signatureHeader: string; headers: Record<string, string> } {
    const rawBody = JSON.stringify(payload);
    const secret = secretOverride || this.secret;
    const hash = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const signatureHeader = `sha256=${hash}`;

    return {
      rawBody,
      signatureHeader,
      headers: {
        'content-type': 'application/json',
        'x-gateway-signature': signatureHeader,
        'x-gateway-event': payload.event,
        'x-gateway-delivery-id': crypto.randomUUID(),
        'x-gateway-timestamp': Date.now().toString(),
      },
    };
  }
}
