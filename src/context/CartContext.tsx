"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { CartItem, Product } from "@/types";
import { getFromStorage, saveToStorage } from "@/lib/utils";

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
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, size: string, color: string, quantity?: number) => boolean;
  addDirectItem: (item: CartItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "velure_cart_items_v1";
const COUPON_STORAGE_KEY = "velure_coupon_code_v1";
const FREE_SHIPPING_THRESHOLD = 1999;

// Default initial items for luxury atelier demo:
// 1. Linen Chore Jacket (Size M, Espresso Brown, ₹4,200)
// 2. Linen Camp Collar Shirt (Size M, Olive Drab, ₹2,600)
const INITIAL_DEMO_ITEMS: CartItem[] = [
  {
    id: "prod-001-var-001-m-esp",
    productId: "prod-001",
    productSlug: "linen-chore-jacket-espresso",
    name: "Linen Chore Jacket",
    price: 4200,
    originalPrice: 4800,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
    size: "M",
    color: "Espresso Brown",
    colorHex: "#3D1B00",
    quantity: 1,
    maxStock: 3,
    sku: "LCJ-ESP-M",
  },
  {
    id: "prod-006-var-006-m-olv",
    productId: "prod-006",
    productSlug: "linen-camp-collar-shirt-olive",
    name: "Linen Camp Collar Shirt",
    price: 2600,
    originalPrice: 2950,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1600&auto=format&fit=crop",
    size: "M",
    color: "Olive Drab",
    colorHex: "#52523F",
    quantity: 1,
    maxStock: 10,
    sku: "CCS-OLV-M",
  },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    const saved = getFromStorage<CartItem[]>(CART_STORAGE_KEY, INITIAL_DEMO_ITEMS);
    setItems(saved);
    const savedCoupon = getFromStorage<string | null>(COUPON_STORAGE_KEY, "FESTIVE10");
    setAppliedCoupon(savedCoupon);
    setIsHydrated(true);
  }, []);

  // Save to storage on change
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(CART_STORAGE_KEY, items);
    }
  }, [items, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToStorage(COUPON_STORAGE_KEY, appliedCoupon);
    }
  }, [appliedCoupon, isHydrated]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const code = appliedCoupon.trim().toUpperCase();
    if (code === "FESTIVE10") {
      return Math.round(subtotal * 0.1);
    }
    if (code === "WELCOME15") {
      return Math.round(subtotal * 0.15);
    }
    if (code === "ATELIER20") {
      return Math.round(subtotal * 0.2);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 250;
  }, [subtotal]);

  const freeShippingProgress = useMemo(() => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 100;
    return Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + shipping);
  }, [subtotal, discount, shipping]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addItem = (product: Product, size: string, color: string, quantity = 1): boolean => {
    const variant = product.variants.find(
      (v) => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase() === color.toLowerCase()
    );

    const maxStock = variant ? variant.stock : 10;
    const itemId = `${product.id}-${size}-${color}`.toLowerCase().replace(/\s+/g, "-");
    const colorObj = product.colors.find((c) => c.name.toLowerCase() === color.toLowerCase());

    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, maxStock);
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i));
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          productSlug: product.slug,
          name: product.name,
          price: product.price,
          originalPrice: product.compareAtPrice,
          image: product.images[0]?.url || "",
          size,
          color,
          colorHex: colorObj?.hex || "#3d2314",
          quantity: Math.min(quantity, maxStock),
          maxStock,
          sku: variant?.sku || `${product.id}-${size}`,
        },
      ];
    });

    setIsCartOpen(true);
    return true;
  };

  const addDirectItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i));
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
            return {
              ...item,
              quantity: Math.min(nextQty, item.maxStock),
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

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (["FESTIVE10", "WELCOME15", "ATELIER20"].includes(clean)) {
      setAppliedCoupon(clean);
      setCouponError(null);
      return true;
    }
    setCouponError("Invalid coupon code. Try 'FESTIVE10' for 10% off.");
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        appliedCoupon,
        couponError,
        shipping,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingProgress,
        total,
        isCartOpen,
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
