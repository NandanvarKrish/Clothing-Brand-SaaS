export type CarrierName =
  | "BlueDart Express Air"
  | "Delhivery Priority Express"
  | "DHL Express India"
  | "Atelier White-Glove Courier";

export type ShippingStatusCode =
  | "manifested"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_attempt"
  | "returned_to_origin"
  | "cancelled";

export interface TrackingEvent {
  status: ShippingStatusCode;
  description: string;
  location?: string;
  timestamp: string;
}

export interface ShipmentManifest {
  id: string;
  orderId: string;
  orderNumber: string;
  carrier: CarrierName;
  trackingNumber: string;
  trackingUrl: string;
  shippingStatus: ShippingStatusCode;
  estimatedDelivery?: string;
  events?: TrackingEvent[];
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface AddressValidationResult {
  valid: boolean;
  city?: string;
  state?: string;
  isServiceable: boolean;
  estimatedDays?: string;
  error?: string;
}

export interface ShippingProvider {
  name: string;
  createShipment(order: any): Promise<{ success: boolean; shipment?: ShipmentManifest; error?: string }>;
  getTracking(trackingNumber: string): Promise<{ success: boolean; events?: TrackingEvent[]; error?: string }>;
  cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }>;
}
