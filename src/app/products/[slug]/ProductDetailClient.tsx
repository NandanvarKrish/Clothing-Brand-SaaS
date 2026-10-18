"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingBag,
  Zap,
  Heart,
  MapPin,
  CheckCircle,
  Leaf,
  Award,
  Truck,
  Maximize2,
  Ruler,
  ChevronDown,
  Layers,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { checkPincodeDelivery, PincodeDeliveryInfo } from "@/services/productService";
import { SizeGuideModal } from "@/components/products/SizeGuideModal";
import { ImageLightboxModal } from "@/components/products/ImageLightboxModal";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "M");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [pincode, setPincode] = useState("400050");
  const [deliveryInfo, setDeliveryInfo] = useState<PincodeDeliveryInfo | null>(() =>
    checkPincodeDelivery("400050")
  );

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    fabric: true,
    fit: false,
    shipping: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isWished = isInWishlist(product.id);
  const activeImage = product.images[activeImageIndex] || product.images[0];
  const [mainImgUrl, setMainImgUrl] = useState(activeImage?.url || "");

  React.useEffect(() => {
    setMainImgUrl(activeImage?.url || "");
  }, [activeImage]);

  const handleVerifyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryInfo(checkPincodeDelivery(pincode));
  };

  const handleAddToBag = () => {
    addItem(product, selectedSize, selectedColor, 1);
  };

  const handleInstantCheckout = () => {
    addItem(product, selectedSize, selectedColor, 1);
    router.push("/checkout");
  };

  // Find active variant stock
  const activeVariant = product.variants.find(
    (v) =>
      v.size.toLowerCase() === selectedSize.toLowerCase() &&
      v.color.toLowerCase() === selectedColor.toLowerCase()
  );
  const stockCount = activeVariant ? activeVariant.stock : 8;

  return (
    <div className="w-full bg-surface pb-24">
      {/* 1. Breadcrumbs */}
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-6 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="text-on-surface-variant/40">/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-primary transition-colors">
            {product.category}
          </Link>
          <span className="text-on-surface-variant/40">/</span>
          <span className="text-primary font-medium tracking-tight truncate">
            {product.name} — {selectedColor}
          </span>
        </nav>
      </div>

      {/* 2. Main Product Showcase Grid */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-start">
          {/* LEFT COLUMN: Gallery */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Main Portrait Editorial Viewer */}
            <div className="relative w-full rounded-xl overflow-hidden bg-surface-container shadow-md group">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-container-high">
                <Image
                  src={mainImgUrl}
                  alt={activeImage?.alt || product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  onError={() => setMainImgUrl("https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop")}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Floating Detail Pill */}
                <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    {product.gsm ? `${product.gsm} GSM ` : ""}
                    {product.fabric}
                  </span>
                </div>

                {/* Expand Gallery Trigger */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  aria-label="Expand image view"
                  className="absolute bottom-4 right-4 bg-surface/90 hover:bg-surface text-primary backdrop-blur-md p-2.5 rounded-full shadow-sm transition-all duration-200 flex items-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="font-label-sm text-label-sm font-semibold tracking-wider uppercase pr-1.5 hidden sm:inline">
                    Expand Gallery
                  </span>
                </button>
              </div>
            </div>

            {/* Thumbnail Selector Ribbon */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {product.images.map((img, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-[3/4] rounded-lg overflow-hidden bg-surface-container p-0.5 transition-all duration-200 shadow-sm relative ${
                      isActive
                        ? "ring-2 ring-primary ring-offset-1 opacity-100"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="w-full h-full relative rounded overflow-hidden">
                      <Image
                        src={img.url}
                        alt={img.alt || `Product thumbnail ${idx + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                    {img.label && (
                      <span className="absolute bottom-1.5 left-1.5 bg-surface-container-lowest/90 backdrop-blur-sm text-[10px] font-label-sm uppercase px-1.5 py-0.5 rounded text-on-surface">
                        {img.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Artisan Value Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="bg-surface-container-lowest p-3.5 rounded-lg shadow-sm flex items-center gap-3 border border-outline-variant/20">
                <Leaf className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                    100% Belgian Flax
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Naturally thermoregulating
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-3.5 rounded-lg shadow-sm flex items-center gap-3 border border-outline-variant/20">
                <Award className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                    Horn Hardware
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Ethically carved buttons
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-3.5 rounded-lg shadow-sm flex items-center gap-3 border border-outline-variant/20">
                <Truck className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                    Express Delivery
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Air priority dispatch
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Garment Details & Purchasing Block (Sticky) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
            {/* Header & Price Block */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-secondary font-bold">
                  Vélure Atelier • Autumn 24
                </span>
                <span className="bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold tracking-wider uppercase">
                  {product.edition || "Limited Edition"}
                </span>
              </div>

              <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-primary font-bold tracking-tight mt-1">
                {product.name} — {selectedColor}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <span className="font-label-md text-label-md font-semibold text-primary">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-on-surface-variant/40">•</span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {product.reviewCount} Verified Atelier Reviews
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-headline-lg text-headline-lg font-bold text-primary font-tabular-num">
                  {formatPrice(product.price)}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  Taxes included. Free express air shipping.
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="w-full h-[1px] bg-outline-variant/30" />

            {/* Color Selector */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">
                  Color:{" "}
                  <span className="font-normal normal-case text-on-surface-variant">
                    {selectedColor}
                  </span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-medium">
                  Vegetal Yarn Dyed
                </span>
              </div>

              <div className="flex items-center gap-3">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      aria-label={`Select ${color.name}`}
                      className={`relative w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-all ${
                        isSelected
                          ? "ring-2 ring-offset-2 ring-primary scale-105"
                          : "ring-1 ring-outline-variant/60 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-surface" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector & Guide */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">
                  Size:{" "}
                  <span className="font-normal normal-case text-on-surface-variant">
                    {selectedSize} (True to Fit)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="font-label-sm text-label-sm text-secondary hover:text-primary font-semibold flex items-center gap-1 transition-colors"
                >
                  <Ruler className="w-4 h-4" /> Size Guide &amp; Fit Advisor
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 rounded-lg font-title-md text-title-md font-semibold transition-all shadow-sm ${
                        isSelected
                          ? "bg-primary-container text-on-primary shadow-primary/20"
                          : "bg-surface-container hover:bg-surface-container-high text-primary"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Stock Status Chip */}
              {stockCount === 0 ? (
                <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-error-container text-error rounded-lg">
                  <span className="font-label-sm text-label-sm font-semibold">
                    Sold out in Size {selectedSize}. Restock planned for next lot.
                  </span>
                </div>
              ) : stockCount <= 5 ? (
                <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#F9F0E6] rounded-lg">
                  <Zap className="w-4 h-4 text-[#BC6C25] shrink-0" />
                  <span className="font-label-sm text-label-sm text-[#BC6C25] font-semibold">
                    Low Batch: Only {stockCount} pieces left in Size {selectedSize} for this production run.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-in-stock-bg rounded-lg">
                  <CheckCircle className="w-4 h-4 text-in-stock shrink-0" />
                  <span className="font-label-sm text-label-sm text-in-stock font-semibold">
                    In Stock ({stockCount} available) • Ready for complimentary express dispatch.
                  </span>
                </div>
              )}
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={stockCount === 0}
                className="w-full h-12 bg-primary-container hover:bg-[#7F4F24] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-on-primary rounded-lg font-title-md text-title-md font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-primary/10"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {stockCount === 0 ? "Sold Out" : `Add to Bag — ${formatPrice(product.price)}`}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                <button
                  type="button"
                  onClick={handleInstantCheckout}
                  className="sm:col-span-5 h-11 bg-surface-container-lowest hover:bg-surface-container text-primary font-title-md text-title-md font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all border border-outline-variant/30"
                >
                  <Zap className="w-4 h-4 text-secondary" />
                  <span>Instant Express Checkout</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">
                    (UPI / Cards)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
                  className="sm:col-span-1 h-11 bg-surface-container-lowest hover:bg-surface-container text-primary rounded-lg shadow-sm flex items-center justify-center transition-all border border-outline-variant/30"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isWished ? "text-error fill-error" : "text-primary hover:text-secondary"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Delivery PIN Code Checker */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-2.5 border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-secondary" /> Check Estimated Delivery
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Pan-India Transit
                </span>
              </div>

              <form onSubmit={handleVerifyPincode} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 h-10 px-3.5 rounded-lg bg-surface-container font-tabular-num text-tabular-num text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Verify
                </button>
              </form>

              {deliveryInfo?.valid ? (
                <div className="flex items-start gap-2 pt-1 text-on-surface">
                  <CheckCircle className="w-4 h-4 text-[#386641] shrink-0 mt-0.5" />
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Delivery in <strong className="text-primary font-semibold">{deliveryInfo.days}</strong> to {deliveryInfo.city} ({deliveryInfo.pincode}) via {deliveryInfo.courier}.
                  </p>
                </div>
              ) : deliveryInfo ? (
                <p className="font-body-sm text-body-sm text-error">
                  Please enter a valid 6-digit Indian delivery PIN code.
                </p>
              ) : null}
            </div>

            {/* Editorial Accordions */}
            <div className="flex flex-col gap-2 pt-2">
              {/* Accordion 1: Fabric & Craftsmanship */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => toggleAccordion("fabric")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container/50 transition-colors"
                >
                  <span className="font-title-md text-title-md text-primary font-semibold flex items-center gap-2.5">
                    <Layers className="w-5 h-5 text-secondary" /> Fabric &amp; Atelier Craftsmanship
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${
                      openAccordions.fabric ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.fabric && (
                  <div className="px-4 pb-4 pt-1 flex flex-col gap-2 font-body-md text-body-md text-on-surface-variant">
                    <p>
                      Milled from premium long-staple European flax in Flanders, Belgium. Specially yarn-dyed using organic vegetable tannins that impart a rich, multi-tonal Espresso hue which patinas beautifully over years of wear.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 font-body-sm text-body-sm mt-1">
                      {product.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 2: Fit & Model Dimensions */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => toggleAccordion("fit")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container/50 transition-colors"
                >
                  <span className="font-title-md text-title-md text-primary font-semibold flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-secondary" /> Fit &amp; Model Dimensions
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${
                      openAccordions.fit ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.fit && (
                  <div className="px-4 pb-4 pt-1 flex flex-col gap-2 font-body-md text-body-md text-on-surface-variant">
                    <p>
                      Tailored with a relaxed utilitarian box cut designed to layer seamlessly over a lightweight sweater or linen shirt. Cut square at the hem with slight drop-shoulders.
                    </p>
                    <div className="bg-surface-container p-3 rounded-lg mt-1 font-body-sm text-body-sm">
                      <p className="font-semibold text-primary">Model Measurement Reference:</p>
                      <p>
                        Julian is 6&apos;1&quot; (185 cm) with a 39&quot; chest and 31&quot; waist, wearing size{" "}
                        <strong className="text-primary font-semibold">Medium</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping & Returns */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container/50 transition-colors"
                >
                  <span className="font-title-md text-title-md text-primary font-semibold flex items-center gap-2.5">
                    <RotateCcw className="w-5 h-5 text-secondary" /> Complimentary Shipping &amp; Returns
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${
                      openAccordions.shipping ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.shipping && (
                  <div className="px-4 pb-4 pt-1 flex flex-col gap-2 font-body-md text-body-md text-on-surface-variant">
                    <p>
                      Each garment arrives packaged in our archival cotton garment bag and recyclable kraft keepsake box.
                    </p>
                    <p className="font-body-sm text-body-sm">
                      We provide complimentary domestic priority shipping on all orders. Should the sizing not be pristine, we welcome returns and size exchanges within 14 days of delivery with complimentary doorstep pickup.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Complete The Look / Related Garments Carousel */}
      {relatedProducts.length > 0 && (
        <section className="w-full bg-surface-container-low py-20">
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-bold block mb-1">
                  Curated Ensemble
                </span>
                <h2 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                  Complete The Look
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Harmoniously styled by our Paris atelier to pair naturally with the {product.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col border border-outline-variant/20"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container">
                    <Image
                      src={item.images[0]?.url || ""}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item)}
                        aria-label="Add to wishlist"
                        className="bg-surface/80 hover:bg-surface text-primary p-2 rounded-full backdrop-blur-md shadow-sm transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isInWishlist(item.id) ? "text-error fill-error" : "text-primary"
                          }`}
                        />
                      </button>
                    </div>
                    {item.badge && (
                      <div className="absolute bottom-3 left-3 bg-primary-container text-on-primary font-label-sm text-label-sm px-2.5 py-1 rounded font-medium">
                        {item.badge}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest block mb-1">
                        {item.category}
                      </span>
                      <h3 className="font-title-md text-title-md text-primary font-semibold">
                        {item.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-headline-md text-headline-md text-primary font-bold font-tabular-num">
                        {formatPrice(item.price)}
                      </span>
                      <Link
                        href={`/products/${item.slug}`}
                        className="h-9 px-4 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center"
                      >
                        View Piece
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        selectedSize={selectedSize}
        onSelectSize={(size) => {
          setSelectedSize(size);
          setIsSizeGuideOpen(false);
        }}
      />

      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={product.images}
        initialIndex={activeImageIndex}
      />
    </div>
  );
}
