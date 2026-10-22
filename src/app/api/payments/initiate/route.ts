import { NextRequest, NextResponse } from 'next/server';
import { initiatePaymentForOrder } from '@/services/payment/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, returnUrl, providerId } = body;

    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid orderNumber is required.' },
        { status: 400 }
      );
    }

    const result = await initiatePaymentForOrder(orderNumber.trim(), {
      returnUrl,
      providerId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      attemptId: result.attemptId,
      provider: result.provider,
      checkoutUrl: result.checkoutUrl,
      status: result.status,
      orderNumber,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate payment session' },
      { status: 500 }
    );
  }
}
