"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "");
  const [addedSize, setAddedSize] = useState<string | null>(null);

  const isWished = isInWishlist(product.id);
  const primaryImg = product.images[0]?.url || "";
  const secondaryImg = product.images[1]?.url || primaryImg;

  const [imgSrc, setImgSrc] = useState(primaryImg);
  const [hoverImgSrc, setHoverImgSrc] = useState(secondaryImg);

  const handleQuickAdd = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, size, selectedColor || product.colors[0]?.name || "Standard", 1);
    setAddedSize(size);
    setTimeout(() => setAddedSize(null), 1500);
  };

  return (
    <article className="group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Aspect 3/4 Image Card Container */}
      <div className="relative w-full aspect-[3/4] bg-surface-container overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
          {/* Primary Image */}
          <Image
            src={imgSrc}
            alt={product.images[0]?.alt || product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImgSrc("https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop")}
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
          />

          {/* Secondary Alternate View Image on Hover */}
          <Image
            src={hoverImgSrc}
            alt={product.images[1]?.alt || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setHoverImgSrc(imgSrc)}
            className="object-cover absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
          />
        </Link>

        {/* Top Badges & Wishlist Button */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div>
            {product.badge && (
              <span className="pointer-events-auto inline-flex items-center px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm text-secondary font-label-sm text-label-sm font-semibold tracking-wider uppercase shadow-sm">
                {product.badge}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
            className="pointer-events-auto w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface hover:text-error hover:scale-110 transition-all flex items-center justify-center shadow-sm"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWished ? "text-error fill-error" : "text-on-surface"
              }`}
            />
          </button>
        </div>

        {/* Quick Add Size Bar Slide-up on Hover */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-1.5 z-10 pointer-events-auto">
          <span className="font-label-sm text-label-sm text-surface-container-lowest uppercase tracking-wider text-center font-medium">
            {addedSize ? `Added Size ${addedSize}!` : "Instant Size Add"}
          </span>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={(e) => handleQuickAdd(size, e)}
                className={`h-7 px-2 bg-surface-container-lowest/90 hover:bg-surface-container-lowest font-label-sm text-label-sm font-bold text-primary rounded transition-all active:scale-95 ${
                  addedSize === size ? "bg-primary text-on-primary" : ""
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meta Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <Link
            href={`/products/${product.slug}`}
            className="font-title-md text-title-md text-primary font-semibold tracking-tight hover:text-secondary transition-colors truncate"
          >
            {product.name}
          </Link>
          <span className="font-tabular-num text-tabular-num font-bold text-primary whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mt-0.5">
          <span className="truncate pr-2">{product.subtitle}</span>
          <span className="font-label-sm text-label-sm text-secondary font-medium shrink-0">
            {product.fabric}
          </span>
        </div>

        {/* Color Swatches */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-surface-container">
          <div className="flex items-center gap-1.5">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(c.name);
                }}
                title={c.name}
                aria-label={c.name}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  selectedColor === c.name
                    ? "ring-2 ring-primary ring-offset-1 scale-110"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {product.colors.length} {product.colors.length === 1 ? "Color" : "Colors"}
          </span>
        </div>
      </div>
    </article>
  );
}
