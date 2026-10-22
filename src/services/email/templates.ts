import { EmailPayload } from "./types";
import { formatPrice } from "@/lib/utils";

const BRAND_NAME = "VÉLURE ATELIER";
const CONCIERGE_EMAIL = "concierge@velure.atelier";

/**
 * Builds responsive, brand-aligned HTML and plain-text representations for transactional emails.
 */
export function buildEmailTemplate(payload: EmailPayload): { subject: string; html: string; text: string } {
  const {
    recipientName,
    orderNumber,
    eventType,
    orderSummary,
    carrier,
    trackingNumber,
    trackingUrl,
    decision,
    notes,
    refundAmount,
  } = payload;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://velure-atelier.com";
  const commissionUrl = `${appUrl}/account/orders/${encodeURIComponent(orderNumber)}`;

  let title = "Atelier Communication";
  let preheader = "";
  let bodyContent = "";

  switch (eventType) {
    case "order_confirmed":
      title = "Commission Received";
      preheader = `We have received your bespoke commission #${orderNumber}.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Thank you for entrusting VÉLURE ATELIER with your wardrobe. Your commission <strong>#${orderNumber}</strong> has been authoritatively recorded and queued for bespoke pattern preparation.
        </p>
        ${renderOrderSummaryHtml(orderSummary)}
      `;
      break;

    case "payment_confirmed":
      title = "Payment Verified";
      preheader = `Payment confirmed for commission #${orderNumber}.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          We have verified and captured your settlement of <strong>${orderSummary ? formatPrice(orderSummary.totalAmount) : "your payment"}</strong> for commission <strong>#${orderNumber}</strong>.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #555;">
          Our master artisans have released your selected fabric lengths for precision handcrafting.
        </p>
      `;
      break;

    case "payment_pending":
      title = "Payment Action Required";
      preheader = `Settlement pending for commission #${orderNumber}.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Your commission <strong>#${orderNumber}</strong> is reserved, awaiting verified settlement. Please complete your transaction to begin atelier tailoring.
        </p>
      `;
      break;

    case "order_processing":
      title = "Atelier Tailoring Commenced";
      preheader = `Garments for commission #${orderNumber} are now being crafted.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Bespoke laser cutting and seam construction have officially commenced for commission <strong>#${orderNumber}</strong>. Each silhouette undergoes individual tactile inspection before air packaging.
        </p>
      `;
      break;

    case "shipment_dispatched":
      title = "Commission Dispatched";
      preheader = `Your garments for #${orderNumber} have boarded priority air transit.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Your pieces have been hand-packaged in our archival presentation boxes and transferred to <strong>${carrier || "BlueDart Express Air"}</strong>.
        </p>
        <div style="margin: 24px 0; padding: 18px; background-color: #F7F5F0; border-radius: 8px; border: 1px solid #EAE5D9;">
          <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8C7355; font-weight: 600;">Priority Tracking AWB</p>
          <p style="margin: 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #0F0F0F;">${trackingNumber || "Assigned upon cargo scan"}</p>
        </div>
      `;
      break;

    case "order_delivered":
      title = "White-Glove Handover Confirmed";
      preheader = `Commission #${orderNumber} has been safely delivered.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Courier delivery has been completed for commission <strong>#${orderNumber}</strong>. We trust these garments elevate your aesthetic sensibilities.
        </p>
        <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: #666;">
          Under our 14-day boutique policy, complimentary returns and size adjustments remain accessible through your client account.
        </p>
      `;
      break;

    case "cancellation_confirmed":
      title = "Cancellation Approved";
      preheader = `Commission #${orderNumber} has been cancelled.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          As requested, commission <strong>#${orderNumber}</strong> has been cancelled and any reserved apparel lengths have been released.
        </p>
        ${notes ? `<p style="margin: 0 0 16px; font-size: 14px; color: #555;"><em>Note: ${notes}</em></p>` : ""}
      `;
      break;

    case "return_requested":
      title = "Return Request Received";
      preheader = `Return request logged for #${orderNumber}.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          We have received your return inquiry for commission <strong>#${orderNumber}</strong>. Our atelier concierge is reviewing garment eligibility under our 14-day window.
        </p>
      `;
      break;

    case "return_decision":
      title = decision === "approved" ? "Return Request Approved" : "Return Request Review";
      preheader = `Update on return request for #${orderNumber}.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Your return request for commission <strong>#${orderNumber}</strong> has been <strong>${decision?.toUpperCase() || "REVIEWED"}</strong> by our inspection desk.
        </p>
        ${notes ? `<p style="margin: 0 0 16px; font-size: 14px; color: #555;">Concierge Notes: ${notes}</p>` : ""}
      `;
      break;

    case "refund_processed":
      title = "Atelier Payout Initiated";
      preheader = `Refund recorded for #${orderNumber}.`;
      bodyContent = `
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          Dear ${recipientName},
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #2D2D2D;">
          A refund of <strong>${refundAmount ? formatPrice(refundAmount) : "the agreed amount"}</strong> has been logged and queued for transfer to your recorded bank / UPI coordinates.
        </p>
      `;
      break;
  }

  const subject = payload.subject || `${BRAND_NAME} — ${title} (#${orderNumber})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <span style="display: none; font-size: 0; max-height: 0; line-height: 0; mso-hide: all; opacity: 0;">${preheader}</span>
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F9F6F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #EBE6DC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #F0ECE1; background-color: #FFFFFF;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; letter-spacing: 3px; color: #0F0F0F; font-weight: 500;">VÉLURE</h1>
              <p style="margin: 4px 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8C7355; font-weight: 600;">Atelier &bull; Bengaluru</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 20px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #0F0F0F; font-weight: 500;">${title}</h2>
              ${bodyContent}

              <!-- Action CTA -->
              <div style="margin: 32px 0 16px; text-align: center;">
                <a href="${trackingUrl || commissionUrl}" style="display: inline-block; padding: 13px 28px; background-color: #0F0F0F; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; border-radius: 6px;">
                  ${trackingUrl ? "Track Air Dispatch" : "View Commission Details"}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #FAF8F5; border-top: 1px solid #F0ECE1; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #666;">
                Questions? Inquire with atelier concierge at <a href="mailto:${CONCIERGE_EMAIL}" style="color: #8C7355; text-decoration: none;">${CONCIERGE_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #999;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. Handcrafted in Bengaluru, India.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${BRAND_NAME}
${title} — Commission #${orderNumber}

Dear ${recipientName},

${preheader}

View commission details online: ${commissionUrl}
${trackingUrl ? `Track courier dispatch: ${trackingUrl}` : ""}

Support Concierge: ${CONCIERGE_EMAIL}
© ${new Date().getFullYear()} ${BRAND_NAME}.
  `.trim();

  return { subject, html, text };
}

function renderOrderSummaryHtml(summary?: EmailPayload["orderSummary"]): string {
  if (!summary || !summary.items || summary.items.length === 0) return "";

  const rows = summary.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #F0ECE1; font-size: 13px; color: #222;">
        <strong>${item.name}</strong><br>
        <span style="font-size: 11px; color: #777;">${item.variantDescription || ""} &bull; Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #F0ECE1; font-size: 13px; text-align: right; color: #222; font-weight: 600;">
        ${formatPrice(item.lineTotal || item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 10px; border-top: 1px solid #F0ECE1;">
      ${rows}
      <tr>
        <td style="padding: 12px 0 4px; font-size: 14px; font-weight: 600; color: #0F0F0F;">Total Commission</td>
        <td style="padding: 12px 0 4px; font-size: 15px; font-weight: bold; text-align: right; color: #0F0F0F;">${formatPrice(summary.totalAmount)}</td>
      </tr>
    </table>
  `;
}
