import { NextRequest, NextResponse } from 'next/server';
import { getOrderByNumber } from '@/services/orderService';
import { getPaymentProvider } from '@/services/payment/paymentService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const providerId = request.nextUrl.searchParams.get('provider') || undefined;

    // Check if id is an order number (e.g. VEL-2024-XXXX)
    if (id.startsWith('VEL-')) {
      const order = await getOrderByNumber(id);
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        totalAmount: order.totalAmount,
        bankReferenceNumber: order.bankReferenceNumber || null,
        updatedAt: order.updatedAt,
      });
    }

    // Otherwise check payment session directly with the active provider
    const provider = getPaymentProvider(providerId);
    const result = await provider.getPaymentStatus(id);

    return NextResponse.json({
      success: true,
      paymentId: id,
      provider: provider.id,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
