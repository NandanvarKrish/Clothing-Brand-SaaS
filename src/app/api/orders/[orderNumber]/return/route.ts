import { NextRequest, NextResponse } from "next/server";
import { createReturnRequest } from "@/services/returnService";
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
        { success: false, error: "Authentication required to initiate return" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reason, customerNotes, items } = body;

    if (!reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Reason and at least one return item are required." },
        { status: 400 }
      );
    }

    const result = await createReturnRequest({
      orderNumber: params.orderNumber,
      reason,
      customerNotes,
      items,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process return request" },
      { status: 500 }
    );
  }
}
