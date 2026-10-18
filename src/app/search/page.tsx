import React, { Suspense } from "react";
import { SearchClient } from "./SearchClient";

export const metadata = {
  title: "Search Catalog | Vélure Atelier",
  description: "Search all garments, silhouettes, and fabric compositions.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16 text-center text-on-surface-variant">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-body-md">Searching silhouettes...</p>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
