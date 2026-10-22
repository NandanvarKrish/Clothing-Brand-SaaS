import { NextRequest, NextResponse } from 'next/server';
import { processPaymentWebhook } from '@/services/payment/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Read Raw Body Bytes BEFORE any JSON parsing
    const rawBody = await request.text();

    // 2. Extract Headers in lowercase for uniform comparison
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    const provider = request.nextUrl.searchParams.get('provider') || undefined;

    // 3. Process Authoritative Webhook
    const result = await processPaymentWebhook(rawBody, headersObj, provider);

    return NextResponse.json(result, { status: result.httpStatus });
  } catch (error: any) {
    console.error('Unhandled webhook exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
