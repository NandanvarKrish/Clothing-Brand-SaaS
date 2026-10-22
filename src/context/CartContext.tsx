"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { CartItem, Product } from "@/types";
import { getFromStorage, saveToStorage } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  validateAndRecalculateCart,
  validateCoupon,
  reconcileCartItems,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/services/cartService";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon: string | null;
  couponError: string | null;
  shipping: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  total: number;
  isCartOpen: boolean;
  isValidating: boolean;
  hasUnavailableItems: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, size: string, color: string, quantity?: number) => boolean;
  addDirectItem: (item: CartItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  clearCart: () => void;
  refreshCartValidation: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = "velure_cart_items_guest_v2";
const COUPON_STORAGE_KEY = "velure_coupon_code_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [hasUnavailableItems, setHasUnavailableItems] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Concurrency & mutation locking ref
  const isMutatingRef = useRef(false);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // Storage key is scoped to user session when authenticated
  const currentStorageKey = user ? `velure_cart_items_user_${user.id}` : GUEST_CART_STORAGE_KEY;

  // 1. Initial hydration and session reconciliation on auth state changes
  useEffect(() => {
    const isLoginTransition = prevUserIdRef.current === null && user !== null;
    prevUserIdRef.current = user?.id || null;

    if (isLoginTransition) {
      // Reconcile guest cart into customer's authenticated cart
      const guestItems = getFromStorage<CartItem[]>(GUEST_CART_STORAGE_KEY, []);
      const userItems = getFromStorage<CartItem[]>(`velure_cart_items_user_${user!.id}`, []);
      const merged = reconcileCartItems(guestItems, userItems);

      saveToStorage(`velure_cart_items_user_${user!.id}`, merged);
      saveToStorage(GUEST_CART_STORAGE_KEY, []); // Clear guest cart after reconciliation

      setItems(merged);
      const savedCoupon = getFromStorage<string | null>(COUPON_STORAGE_KEY, null);
      setAppliedCoupon(savedCoupon);
      setIsHydrated(true);

      // Validate merged items authoritatively against DB
      validateAndRecalculateCart(merged, savedCoupon).then((res) => {
        setItems(res.items);
        setDiscountAmount(res.discount);
        setHasUnavailableItems(res.hasUnavailableItems);
      });
      return;
    }

    // Standard initial load
    const saved = getFromStorage<CartItem[]>(currentStorageKey, []);
    const savedCoupon = getFromStorage<string | null>(COUPON_STORAGE_KEY, null);
    setItems(saved);
    setAppliedCoupon(savedCoupon);
    setIsHydrated(true);

    if (saved.length > 0) {
      validateAndRecalculateCart(saved, savedCoupon).then((res) => {
        setItems(res.items);
        setDiscountAmount(res.discount);
        setHasUnavailableItems(res.hasUnavailableItems);
      });
    }
  }, [user, currentStorageKey]);

  // 2. Persist to storage whenever items or coupon change
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(currentStorageKey, items);
    }
  }, [items, currentStorageKey, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(COUPON_STORAGE_KEY, appliedCoupon);
    }
  }, [appliedCoupon, isHydrated]);

  // 3. Derived authoritative totals
  const availableItems = useMemo(() => items.filter((i) => i.isAvailable !== false), [items]);

  const itemCount = useMemo(() => {
    return availableItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [availableItems]);

  const subtotal = useMemo(() => {
    return availableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [availableItems]);

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  }, [subtotal]);

  const freeShippingProgress = useMemo(() => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 100;
    return Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shipping);
  }, [subtotal, discountAmount, shipping]);

  // Re-check discount when subtotal changes
  useEffect(() => {
    if (appliedCoupon && subtotal > 0) {
      validateCoupon(appliedCoupon, subtotal).then((res) => {
        if (res.valid) {
          setDiscountAmount(res.discount);
          setCouponError(null);
        } else {
          setDiscountAmount(0);
          setCouponError(res.error);
        }
      });
    } else {
      setDiscountAmount(0);
    }
  }, [appliedCoupon, subtotal]);

  const openCart = () => {
    setIsCartOpen(true);
    refreshCartValidation();
  };
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => {
    setIsCartOpen((prev) => {
      const next = !prev;
      if (next) refreshCartValidation();
      return next;
    });
  };

  const refreshCartValidation = useCallback(async () => {
    if (items.length === 0) return;
    setIsValidating(true);
    try {
      const res = await validateAndRecalculateCart(items, appliedCoupon);
      setItems(res.items);
      setDiscountAmount(res.discount);
      setHasUnavailableItems(res.hasUnavailableItems);
      if (res.couponError) setCouponError(res.couponError);
    } catch (err) {
      console.error("Cart validation failed:", err);
    } finally {
      setIsValidating(false);
    }
  }, [items, appliedCoupon]);

  // 4. Add item with concurrency lock & duplicate prevention
  const addItem = (product: Product, size: string, color: string, quantity = 1): boolean => {
    if (isMutatingRef.current) return false;
    isMutatingRef.current = true;

    try {
      const variant = product.variants.find(
        (v) =>
          v.size.toLowerCase() === size.toLowerCase() &&
          v.color.toLowerCase() === color.toLowerCase()
      );

      const maxStock = variant ? Number(variant.stock) : 0;
      if (maxStock <= 0) {
        return false;
      }

      const itemId = `${product.id}-${size}-${color}`.toLowerCase().replace(/\s+/g, "-");
      const colorObj = product.colors.find((c) => c.name.toLowerCase() === color.toLowerCase());
      const authoritativePrice = variant ? Number(variant.price) : Number(product.price);

      setItems((prev) => {
        const existing = prev.find((i) => i.id === itemId);
        if (existing) {
          // Increment existing up to available stock limit
          const newQty = Math.min(existing.quantity + quantity, maxStock);
          return prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  quantity: newQty,
                  price: authoritativePrice,
                  originalPrice: product.compareAtPrice,
                  maxStock,
                  isAvailable: true,
                  stockStatus: maxStock <= 5 ? "low_stock" : "in_stock",
                  message: undefined,
                }
              : i
          );
        }

        return [
          ...prev,
          {
            id: itemId,
            productId: product.id,
            productSlug: product.slug,
            name: product.name,
            price: authoritativePrice,
            originalPrice: product.compareAtPrice,
            image: product.images[0]?.url || "",
            size,
            color,
            colorHex: colorObj?.hex || "#3D1B00",
            quantity: Math.min(quantity, maxStock),
            maxStock,
            sku: variant?.sku || `${product.id}-${size}`,
            variantId: variant?.id,
            isAvailable: true,
            stockStatus: maxStock <= 5 ? "low_stock" : "in_stock",
          },
        ];
      });

      setIsCartOpen(true);
      return true;
    } finally {
      setTimeout(() => {
        isMutatingRef.current = false;
      }, 100);
    }
  };

  const addDirectItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock || 20) }
            : i
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            const cappedQty = Math.min(nextQty, item.maxStock);
            return {
              ...item,
              quantity: cappedQty,
              message: nextQty > item.maxStock ? `Only ${item.maxStock} pieces remaining.` : undefined,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    const res = await validateCoupon(code, subtotal);
    if (res.valid) {
      setAppliedCoupon(res.code);
      setDiscountAmount(res.discount);
      setCouponError(null);
      return true;
    }
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError(res.error);
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setDiscountAmount(0);
  };

  const clearCart = () => {
    setItems([]);
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponError(null);
    setHasUnavailableItems(false);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount: discountAmount,
        appliedCoupon,
        couponError,
        shipping,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingProgress,
        total,
        isCartOpen,
        isValidating,
        hasUnavailableItems,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        addDirectItem,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
        refreshCartValidation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
