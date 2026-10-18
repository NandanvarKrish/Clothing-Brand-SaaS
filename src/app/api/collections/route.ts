import { NextResponse } from "next/server";
import { getCollections } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await getCollections();
    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch collections" },
      { status: 500 }
    );
  }
}
