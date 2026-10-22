import { NextRequest, NextResponse } from "next/server";
import { getCustomerOrders } from "@/services/orderService";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const orders = await getCustomerOrders(user.id, user.email);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve orders" },
      { status: 500 }
    );
  }
}
