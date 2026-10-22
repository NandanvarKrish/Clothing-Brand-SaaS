import { NextRequest, NextResponse } from "next/server";
import { validateAndSyncWishlist } from "@/services/wishlistService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    const validated = await validateAndSyncWishlist(items);

    return NextResponse.json({
      success: true,
      items: validated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate wishlist" },
      { status: 500 }
    );
  }
}
