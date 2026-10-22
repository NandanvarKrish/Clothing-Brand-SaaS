import { NextRequest, NextResponse } from "next/server";
import { requestOrderCancellation } from "@/services/orderService";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to cancel order" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Customer requested cancellation";

    const result = await requestOrderCancellation(params.orderNumber, reason, {
      id: user.id,
      email: user.email,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process cancellation request" },
      { status: 500 }
    );
  }
}
