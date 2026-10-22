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
  id?: string;
  url: string;
  alt: string;
  label?: string; // 'Front' | 'Back' | 'Detail' | 'Lookbook'
  sortOrder?: number;
  isPrimary?: boolean;
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
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
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
  variantId?: string;
  isAvailable?: boolean;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unavailable';
  priceChanged?: boolean;
  message?: string;
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
  isAvailable?: boolean;
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type FulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'tailoring'
  | 'processing'
  | 'inspection'
  | 'dispatched'
  | 'shipped'
  | 'delivered'
  | 'cancellation_requested'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'in_transit'
  | 'received_at_atelier'
  | 'inspected_passed'
  | 'inspected_failed'
  | 'refunded'
  | 'rejected';

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
  status: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery: string;
  deliveryNotes?: string;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  adminNotes?: string;
}

export interface ReturnItemRecord {
  id?: string;
  returnId?: string;
  orderItemId: string;
  productName: string;
  variantDescription?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  condition?: string;
  imageUrl?: string;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId?: string | null;
  returnNumber: string;
  status: ReturnStatus;
  reason: string;
  customerNotes?: string;
  adminNotes?: string;
  refundAmount: number;
  resolutionStatus: string;
  items: ReturnItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistoryEntry {
  id?: string;
  orderId: string;
  orderNumber?: string;
  previousStatus?: string;
  newStatus: string;
  statusType: 'fulfillment' | 'payment';
  notes?: string;
  changedBy?: string;
  createdAt: string;
}

export interface CustomerProfile {
  id?: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerAddress {
  id: string;
  customerId?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt?: string;
}
