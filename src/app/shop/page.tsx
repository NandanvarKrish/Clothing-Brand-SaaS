import React, { Suspense } from "react";
import { ShopClient } from "./ShopClient";

export const metadata = {
  title: "All Garments & Silhouettes | Vélure Atelier",
  description:
    "Explore our complete catalog of small-batch garments woven from organic Belgian linen, handspun khadi, and raw Mulberry silk.",
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16 text-center text-on-surface-variant">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-body-md">Loading atelier silhouettes...</p>
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
