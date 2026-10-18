"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, WishlistItem } from "@/types";
import { getFromStorage, saveToStorage } from "@/lib/utils";

interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "velure_wishlist_items_v1";

const INITIAL_DEMO_WISHLIST: WishlistItem[] = [
  {
    productId: "prod-001",
    slug: "linen-chore-jacket-espresso",
    name: "Linen Chore Jacket",
    price: 4200,
    compareAtPrice: 4800,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
    category: "Outerwear",
    badge: "Low Batch (8 left)",
    addedAt: "2024-10-14T10:00:00Z",
  },
  {
    productId: "prod-002",
    slug: "raw-silk-midi-dress-sand-dune",
    name: "Raw Silk Midi Dress",
    price: 3850,
    compareAtPrice: 4400,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1600&auto=format&fit=crop",
    category: "Dresses",
    badge: "Bestseller",
    addedAt: "2024-10-14T11:00:00Z",
  },
  {
    productId: "prod-003",
    slug: "sculpted-tailored-blazer-espresso",
    name: "Sculpted Tailored Blazer",
    price: 6200,
    compareAtPrice: 7100,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    category: "Outerwear",
    badge: "Limited Run (12 left)",
    addedAt: "2024-10-14T12:00:00Z",
  },
];

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = getFromStorage<WishlistItem[]>(WISHLIST_STORAGE_KEY, INITIAL_DEMO_WISHLIST);
    setItems(saved);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(WISHLIST_STORAGE_KEY, items);
    }
  }, [items, isHydrated]);

  const isInWishlist = (productId: string) => {
    return items.some((i) => i.productId === productId);
  };

  const toggleWishlist = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.productId === product.id);
      if (exists) {
        return prev.filter((i) => i.productId !== product.id);
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images[0]?.url || "",
          category: product.category,
          badge: product.badge,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearWishlist = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount: items.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
