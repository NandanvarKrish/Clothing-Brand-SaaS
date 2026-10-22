"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Product, WishlistItem } from "@/types";
import { getFromStorage, saveToStorage } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { validateAndSyncWishlist, reconcileWishlistIds } from "@/services/wishlistService";

interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_STORAGE_KEY = "velure_wishlist_items_guest_v2";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const currentStorageKey = user
    ? `velure_wishlist_items_user_${user.id}`
    : GUEST_WISHLIST_STORAGE_KEY;

  // 1. Initial hydration and session reconciliation
  useEffect(() => {
    const isLoginTransition = prevUserIdRef.current === null && user !== null;
    prevUserIdRef.current = user?.id || null;

    if (isLoginTransition) {
      // Reconcile guest wishlist into customer's authenticated wishlist
      const guestItems = getFromStorage<WishlistItem[]>(GUEST_WISHLIST_STORAGE_KEY, []);
      const userItems = getFromStorage<WishlistItem[]>(`velure_wishlist_items_user_${user!.id}`, []);

      const guestIds = guestItems.map((i) => i.productId);
      const userIds = userItems.map((i) => i.productId);
      const mergedIds = reconcileWishlistIds(guestIds, userIds);

      saveToStorage(GUEST_WISHLIST_STORAGE_KEY, []);

      // Validate merged IDs against real catalog
      validateAndSyncWishlist(mergedIds.map((id) => ({ productId: id }))).then((validated) => {
        setItems(validated);
        saveToStorage(`velure_wishlist_items_user_${user!.id}`, validated);
      });
      setIsHydrated(true);
      return;
    }

    const saved = getFromStorage<WishlistItem[]>(currentStorageKey, []);
    setItems(saved);
    setIsHydrated(true);

    if (saved.length > 0) {
      validateAndSyncWishlist(saved).then((validated) => {
        setItems(validated);
      });
    }
  }, [user, currentStorageKey]);

  // 2. Persist to storage on change
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(currentStorageKey, items);
    }
  }, [items, currentStorageKey, isHydrated]);

  const refreshWishlist = useCallback(async () => {
    if (items.length === 0) return;
    const validated = await validateAndSyncWishlist(items);
    setItems(validated);
  }, [items]);

  const isInWishlist = (productId: string) => {
    return items.some((i) => i.productId === productId);
  };

  const toggleWishlist = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.productId === product.id);
      if (exists) {
        return prev.filter((i) => i.productId !== product.id);
      }
      const newItem: WishlistItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.images[0]?.url || "",
        category: product.category,
        badge: product.badge,
        addedAt: new Date().toISOString(),
        isAvailable: product.status === "published",
      };
      return [...prev, newItem];
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
        refreshWishlist,
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
