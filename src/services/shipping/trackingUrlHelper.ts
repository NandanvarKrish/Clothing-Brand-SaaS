import { CarrierName } from "./types";

/**
 * Validates and sanitizes an external tracking URL to defend against script injection,
 * invalid protocols, or malformed redirects.
 */
export function sanitizeTrackingUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Relative URLs within the application are permitted
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    // Strictly restrict to http: and https: protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Generates an authoritative carrier tracking URL for an AWB number.
 */
export function generateCarrierTrackingUrl(carrier: string, trackingNumber: string, orderNumber?: string): string {
  const cleanAwb = encodeURIComponent(trackingNumber.trim());
  if (!cleanAwb) return "";

  const cLower = carrier.toLowerCase();

  if (cLower.includes("bluedart")) {
    return `https://www.bluedart.com/tracking?handler=traking&action=auto&numbers=${cleanAwb}`;
  }

  if (cLower.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  }

  if (cLower.includes("dhl")) {
    return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanAwb}`;
  }

  if (orderNumber) {
    return `/account/orders/${encodeURIComponent(orderNumber)}`;
  }

  return "";
}
