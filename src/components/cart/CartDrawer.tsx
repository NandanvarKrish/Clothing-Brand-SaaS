"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, Tag, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { getProducts } from "@/services/productService";
import { Product } from "@/types";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    appliedCoupon,
    couponError,
    shipping,
    freeShippingThreshold,
    freeShippingProgress,
    total,
    isCartOpen,
    hasUnavailableItems,
    closeCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    addItem,
  } = useCart();

  const [couponInput, setCouponInput] = useState(appliedCoupon || "");
  const [pairedProduct, setPairedProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    async function loadPaired() {
      const list = await getProducts({ limit: 1 });
      if (list && list.length > 0) setPairedProduct(list[0]);
    }
    loadPaired();
  }, []);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    applyCoupon(couponInput);
  };

  const handleAddPaired = () => {
    if (pairedProduct) {
      addItem(pairedProduct, pairedProduct.sizes[0] || "M", pairedProduct.colors[0]?.name || "Raw Oatmeal", 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300">
      {/* Background click dismiss */}
      <div className="fixed inset-0" onClick={closeCart} aria-hidden="true" />

      {/* Drawer Panel */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
        className="w-full max-w-[620px] h-full bg-surface-container-lowest shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="px-6 sm:px-8 py-5 bg-surface-container-lowest border-b border-surface-container-high flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <div>
              <h2 className="font-title-md text-title-md text-primary uppercase tracking-wider font-semibold" id="cart-heading">
                Your Shopping Bag
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {itemCount} {itemCount === 1 ? "Curated Piece" : "Curated Pieces"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close Shopping Bag"
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Bronze Progress Bar */}
        <div className="px-6 sm:px-8 py-3.5 bg-surface-container-low">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <p className="font-label-md text-label-md text-on-surface font-medium">
                {subtotal >= freeShippingThreshold ? (
                  <>
                    You&apos;ve unlocked{" "}
                    <span className="text-secondary font-semibold">Complimentary Express Delivery</span> across India!
                  </>
                ) : (
                  <>
                    Add{" "}
                    <span className="text-secondary font-semibold">
                      {formatPrice(freeShippingThreshold - subtotal)}
                    </span>{" "}
                    for Complimentary Express Delivery
                  </>
                )}
              </p>
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              {freeShippingProgress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary-container rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Scrollable Cart Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-7">
          {items.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-2">
                Your Shopping Bag is Empty
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">
                Explore our limited-batch autumn arrivals tailored from organic Belgian flax and pure raw silk.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="px-6 py-3 rounded bg-primary text-on-primary font-title-md text-title-md font-semibold tracking-wide hover:bg-primary-container transition-colors shadow-sm"
              >
                Explore All Silhouettes
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                    Selected Garments
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">Artisanal Ready-To-Ship</span>
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-surface-container-low flex gap-4 transition-all hover:bg-surface-container"
                  >
                    <div className="w-20 h-24 rounded-lg overflow-hidden relative flex-shrink-0 bg-surface-container shadow-sm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            href={`/products/${item.productSlug}`}
                            onClick={closeCart}
                            className="font-title-md text-title-md text-primary font-semibold leading-tight hover:text-secondary transition-colors"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Size: {item.size}
                            </span>
                            <span className="text-outline-variant">•</span>
                            <span className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                              {item.colorHex && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: item.colorHex }}
                                />
                              )}
                              {item.color}
                            </span>
                          </div>
                          {item.isAvailable === false ? (
                            <div className="mt-1 text-xs text-error font-medium">
                              {item.message || "Item no longer available"}
                            </div>
                          ) : item.message ? (
                            <div className="mt-1 text-xs text-[#BC6C25] font-medium">
                              {item.message}
                            </div>
                          ) : null}
                        </div>
                        <span className="font-tabular-num text-tabular-num text-primary font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-surface-container-lowest rounded-md px-1 py-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-tabular-num text-tabular-num font-semibold text-primary text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="font-label-md text-label-md text-on-surface-variant hover:text-error flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Quick Add Mini Card */}
              {pairedProduct && (
                <div className="p-4 rounded-xl bg-surface-container-high/60 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Frequently Paired With
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Atelier Edition</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden relative flex-shrink-0 bg-surface-container">
                      <Image
                        src={pairedProduct.images[0]?.url || ""}
                        alt={pairedProduct.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-title-md text-title-md text-primary font-medium truncate">
                        {pairedProduct.name}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {pairedProduct.subtitle}
                      </p>
                      <p className="font-tabular-num text-tabular-num text-secondary font-semibold mt-0.5">
                        {formatPrice(pairedProduct.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPaired}
                      className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md font-semibold shadow-sm transition-all flex items-center gap-1 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              )}

              {/* Financial Breakdown & Promotional Code */}
              <div className="p-5 rounded-xl bg-surface-container-low space-y-4">
                {/* Coupon Code Input */}
                <div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter coupon or gift card"
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest font-body-md text-body-md text-primary uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold tracking-wider uppercase hover:bg-secondary/90 transition-colors"
                    >
                      {appliedCoupon ? "Applied" : "Apply"}
                    </button>
                  </form>

                  {couponError && (
                    <p className="text-body-sm text-error mt-1">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-[#ebf2ec] text-[#386641] font-label-sm text-label-sm">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>&apos;{appliedCoupon}&apos; coupon applied: 10% Boutique Welcome Courtesy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-tabular-num font-bold">-{formatPrice(discount)}</span>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="hover:underline text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Calculations */}
                <div className="space-y-2.5 pt-3 border-t border-surface-container-high font-body-md text-body-md">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                    <span className="font-tabular-num text-on-surface">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-on-surface-variant">
                    <span>Standard Express Shipping</span>
                    <span className="font-label-md text-label-md font-semibold text-[#386641] uppercase tracking-wide">
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-secondary">
                      <span>Promotional Discount</span>
                      <span className="font-tabular-num font-semibold">-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-surface-container-high flex justify-between items-baseline">
                    <div>
                      <span className="font-title-md text-title-md text-primary font-bold">Total Amount</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Inclusive of all Goods &amp; Services Tax
                      </p>
                    </div>
                    <span className="font-headline-md text-headline-md text-primary font-bold">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Footer & Action Bar */}
        {items.length > 0 && (
          <div className="p-6 sm:px-8 bg-surface-container-lowest border-t border-surface-container-high sticky bottom-0 z-20 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface-variant">Due Now</span>
              <div className="text-right">
                <span className="font-headline-md text-headline-md font-bold text-primary">
                  {formatPrice(total)}
                </span>
                {discount > 0 && (
                  <span className="font-label-sm text-label-sm text-secondary block -mt-1 font-medium">
                    Saved {formatPrice(discount)} Today
                  </span>
                )}
              </div>
            </div>

            {/* Place Order CTA */}
            {hasUnavailableItems ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled
                  className="w-full h-12 rounded-lg bg-surface-container-high text-on-surface-variant/50 font-title-md text-title-md font-semibold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Place Order</span>
                  <span className="font-tabular-num">• {formatPrice(total)}</span>
                </button>
                <p className="text-xs text-error text-center font-medium">
                  Please remove unavailable items before placing order.
                </p>
              </div>
            ) : (
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full h-12 rounded-lg bg-[#582F0E] text-[#FAF7F2] hover:bg-[#7F4F24] font-title-md text-title-md font-semibold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>Place Order</span>
                <span className="font-tabular-num">• {formatPrice(total)}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}

            {/* Return Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={closeCart}
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Storefront &amp; Continue Shopping
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
