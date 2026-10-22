"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  QrCode,
  Smartphone,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

function MockGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order") || "";
  const sessionId = searchParams.get("session") || "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            setOrder(data.order);
          }
        }
      } catch (err) {
        console.warn("Could not fetch order:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  const handleSimulatePayment = async (eventType: "SUCCESS" | "FAILED" | "CANCELLED") => {
    setProcessing(true);
    setOutcome(null);

    try {
      const res = await fetch("/api/payments/simulate-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          event: eventType,
          utr: `SIM-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to deliver simulated webhook.");
        setProcessing(false);
        return;
      }

      setOutcome(eventType);

      if (eventType === "SUCCESS") {
        setTimeout(() => {
          router.push(`/order-confirmation?order=${encodeURIComponent(orderNumber)}`);
        }, 1500);
      } else if (eventType === "CANCELLED") {
        setTimeout(() => {
          router.push("/cart");
        }, 1200);
      } else {
        setProcessing(false);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full max-w-[600px] mx-auto px-6 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
        <p className="font-body-md text-on-surface-variant">Connecting to Payment Sandbox...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="w-full max-w-[600px] mx-auto px-6 py-20 text-center">
        <h1 className="font-headline-md text-primary font-bold mb-3">Order Session Not Found</h1>
        <p className="font-body-md text-on-surface-variant mb-6">
          Unable to locate order #{orderNumber || "unknown"}.
        </p>
        <Link href="/shop" className="px-6 py-2.5 rounded bg-primary text-on-primary font-semibold">
          Return to Atelier
        </Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[720px] mx-auto px-6 py-12">
      {/* Sandbox Notice Banner */}
      <div className="mb-8 p-4 rounded-xl bg-secondary-container/20 border border-secondary-container text-on-surface font-body-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold text-secondary">
            Isolated Payment Sandbox Environment
          </strong>
          <p className="text-on-surface-variant text-xs mt-1">
            Real-money processing is disabled per the security evaluation of experimental banking observers.
            This sandbox executes authoritative HMAC-SHA256 signed webhooks to verify order settlement.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-surface-container-high">
          <div>
            <span className="text-xs uppercase tracking-widest text-secondary font-bold">
              Atelier Payment Gateway
            </span>
            <h1 className="font-headline-md text-primary font-bold">
              Order #{order.orderNumber}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-on-surface-variant block">Amount Due</span>
            <span className="font-headline-md text-primary font-bold font-tabular-num">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* QR Code / Intent Simulation */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 text-center space-y-4">
          <div className="w-48 h-48 mx-auto rounded-xl bg-surface-container flex flex-col items-center justify-center p-4 border border-outline-variant/40">
            <QrCode className="w-32 h-32 text-primary" />
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-1">
              Simulated Vector UPI QR
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
            <Lock className="w-3.5 h-3.5 text-[#386641]" />
            <span>Simulated Banking Rails: <strong>BlueDart Priority &bull; Instant Settlement</strong></span>
          </div>
        </div>

        {/* Interactive Triggers */}
        {outcome === "SUCCESS" ? (
          <div className="p-4 rounded-xl bg-in-stock-bg text-in-stock flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-semibold">Simulated Payment Captured</p>
              <p className="text-xs">Authoritative HMAC webhook verified. Redirecting to confirmation...</p>
            </div>
          </div>
        ) : outcome === "FAILED" ? (
          <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Simulated Payment Expired / Failed</p>
              <p className="text-xs mt-0.5">Webhook delivered FAILED event. The order status has been updated.</p>
              <button
                type="button"
                onClick={() => handleSimulatePayment("SUCCESS")}
                className="mt-3 px-4 py-1.5 rounded bg-error text-white text-xs font-semibold hover:opacity-90"
              >
                Retry &amp; Force Authorize
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant text-center">
              Trigger Authoritative Sandbox Events
            </p>

            <button
              type="button"
              disabled={processing}
              onClick={() => handleSimulatePayment("SUCCESS")}
              className="w-full h-12 rounded-lg bg-[#386641] text-white hover:bg-[#2b4c32] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Verified Payment (Bank SMS &amp; Webhook)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleSimulatePayment("FAILED")}
                className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-error" />
                <span>Simulate 30s Timeout Failure</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleSimulatePayment("CANCELLED")}
                className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
                <span>Cancel &amp; Return to Cart</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href={`/order-confirmation?order=${encodeURIComponent(order.orderNumber)}`}
            className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Skip to order confirmation without settlement &rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[600px] mx-auto px-6 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="font-body-md text-on-surface-variant">Loading payment simulator...</p>
        </div>
      }
    >
      <MockGatewayContent />
    </Suspense>
  );
}
