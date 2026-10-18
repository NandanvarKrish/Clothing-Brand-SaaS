export type ProductCategory = 'All' | 'Tops' | 'Bottoms' | 'Outerwear' | 'Dresses' | 'Knitwear';

export interface ProductColor {
  name: string;
  hex: string;
  inStock?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  price: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  label?: string; // 'Front' | 'Back' | 'Detail' | 'Lookbook'
}

export interface ProductReview {
  id: string;
  author: string;
  city: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  fabric: string;
  fabricOrigin?: string;
  weaveTechnique?: string;
  gsm?: number;
  edition?: string;
  badge?: string;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  collectionIds: string[];
  images: ProductImage[];
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  details: string[];
  care: string[];
  shippingInfo?: string;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  editionBadge?: string;
  itemCount: number;
}

export interface CartItem {
  id: string; // unique item key: `${productId}-${variantId}`
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  colorHex?: string;
  quantity: number;
  maxStock: number;
  sku?: string;
}

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: ProductCategory;
  badge?: string;
  addedAt: string;
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';

export interface CustomerCheckoutDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  saveAddress?: boolean;
}

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  customer: CustomerCheckoutDetails;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'confirmed' | 'tailoring' | 'inspection' | 'dispatched' | 'delivered';
  trackingNumber?: string;
  estimatedDelivery: string;
}
