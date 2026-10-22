import { NextRequest, NextResponse } from 'next/server';
import { getOrderByNumber } from '@/services/orderService';
import { getMockPaymentProvider, processPaymentWebhook } from '@/services/payment/paymentService';

export const dynamic = 'force-dynamic';

/**
 * Development & Testing Helper:
 * Generates an authoritative HMAC-SHA256 signed webhook and dispatches it
 * through the full signature verification and state machine pipeline.
 */
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_PAYMENTS !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Simulated webhooks are strictly disabled in production.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderNumber, event = 'SUCCESS', utr = 'SIM-UTR-789012' } = body;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'orderNumber is required' }, { status: 400 });
    }

    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const mockProvider = getMockPaymentProvider();
    const amountPaise = Math.round(order.totalAmount * 100);

    // Construct valid webhook payload
    const fixture = mockProvider.generateSignedWebhookFixture({
      event,
      paymentId: `sim_pay_${Date.now()}`,
      orderId: order.orderNumber,
      amount: order.totalAmount.toFixed(2),
      amountPaise,
      currency: 'INR',
      method: 'UPI',
      utr,
      completedAt: new Date().toISOString(),
      metadata: {
        simulated: true,
        orderId: order.id,
      },
    });

    // Ingest through authoritative webhook processor
    const result = await processPaymentWebhook(fixture.rawBody, fixture.headers, 'mock');

    return NextResponse.json(result, { status: result.httpStatus });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Simulation error' },
      { status: 500 }
    );
  }
}
