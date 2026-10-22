import { NextRequest, NextResponse } from "next/server";
import { getProducts, getFilterFacets } from "@/services/productService";
import { ProductCategory } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") as ProductCategory | "All" | null;
    const collectionId = searchParams.get("collection") || searchParams.get("collectionId");
    const search = searchParams.get("search") || searchParams.get("q");
    const parsedMin = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const parsedMax = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const minPrice = typeof parsedMin === "number" && !isNaN(parsedMin) && parsedMin >= 0 ? parsedMin : undefined;
    const maxPrice = typeof parsedMax === "number" && !isNaN(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;

    const allowedSorts = ["featured", "newest", "price-asc", "price-desc", "weight"];
    const sortRaw = searchParams.get("sort");
    const sort = sortRaw && allowedSorts.includes(sortRaw) ? (sortRaw as any) : undefined;

    const limitRaw = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const limit = typeof limitRaw === "number" && !isNaN(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : undefined;

    const offsetRaw = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const offset = typeof offsetRaw === "number" && !isNaN(offsetRaw) && offsetRaw >= 0 ? offsetRaw : undefined;

    const colorsParam = searchParams.get("colors");
    const sizesParam = searchParams.get("sizes");
    const fabricsParam = searchParams.get("fabrics");
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const bestseller = searchParams.get("bestseller") === "true" ? true : undefined;
    const newArrival = searchParams.get("newArrival") === "true" ? true : undefined;

    const colors = colorsParam ? colorsParam.split(",").map((c) => c.trim()).filter(Boolean) : undefined;
    const sizes = sizesParam ? sizesParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const fabricOrigin = fabricsParam ? fabricsParam.split(",").map((f) => f.trim()).filter(Boolean) : undefined;

    const products = await getProducts({
      category: category || undefined,
      collectionId: collectionId || undefined,
      search: search || undefined,
      minPrice,
      maxPrice,
      colors,
      sizes,
      fabricOrigin,
      sort,
      featured,
      bestseller,
      newArrival,
      limit,
      offset,
    });

    const facets = await getFilterFacets();

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
      facets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
