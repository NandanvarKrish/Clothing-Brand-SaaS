"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User as UserIcon,
  Package,
  MapPin,
  Settings,
  LogOut,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Mail,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading, signOut, resendVerificationEmail } = useAuth();
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus(null);
    const res = await resendVerificationEmail();
    setIsResending(false);
    if (res.success) {
      setResendStatus("Verification email sent! Please check your inbox.");
    } else {
      setResendStatus(res.error || "Failed to resend. Please try again later.");
    }
  };

  const navItems = [
    { href: "/account", label: "Overview", icon: UserIcon },
    { href: "/account/orders", label: "Order History", icon: Package },
    { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
    { href: "/account/profile", label: "Profile Details", icon: Settings },
  ];

  if (loading) {
    return (
      <main className="w-full min-h-[60vh] flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-body-md text-sm text-on-surface-variant">Loading your atelier account...</p>
        </div>
      </main>
    );
  }

  const isEmailConfirmed = Boolean(user?.email_confirmed_at);

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10 bg-surface">
      {/* Email Verification Banner if not confirmed */}
      {user && !isEmailConfirmed && (
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Email Verification Required</p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Your email <strong className="font-medium text-amber-900">{user.email}</strong> has not yet been verified.
                Confirming ensures you receive tracking updates and atelier drop notices.
              </p>
              {resendStatus && (
                <p className="text-xs font-semibold text-amber-900 mt-1">{resendStatus}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
          >
            {isResending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>Resend Link</span>
          </button>
        </div>
      )}

      {/* Account Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-outline-variant/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Patron Account
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
            {profile?.fullName || "Welcome Back"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {user?.email} • Member since{" "}
            {user?.created_at ? new Date(user.created_at).getFullYear() : "2024"}
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant/60 text-sm font-semibold text-on-surface-variant hover:text-error hover:border-error/40 hover:bg-error/5 transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-outline-variant/30 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="py-8">{children}</div>
    </main>
  );
}
