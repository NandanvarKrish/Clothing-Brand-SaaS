"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { registerSchema, RegisterFormData } from "@/lib/validations/auth";
import { useAuth } from "@/context/AuthContext";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/account";

  const { refreshUser } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("user already registered")) {
          setAuthError("An account with this email address already exists. Please sign in instead.");
        } else {
          setAuthError(error.message);
        }
        return;
      }

      // Check if session was granted or if email verification is required
      if (authData.session) {
        await refreshUser();
        router.push(redirectTo);
        router.refresh();
      } else if (authData.user) {
        // Email verification required
        setRegisteredEmail(data.email);
      }
    } catch (err: any) {
      setAuthError(err?.message || "An unexpected error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="w-full max-w-md mx-auto text-center bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 shadow-sm animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="font-headline-sm text-headline-sm font-serif text-primary mb-2">
          Verify Your Atelier Account
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
          We have dispatched a secure confirmation link to{" "}
          <strong className="text-primary font-medium">{registeredEmail}</strong>. Please check your
          inbox (and spam folder) and click the link to activate your membership.
        </p>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant text-left mb-6 space-y-1.5">
          <p className="font-semibold text-primary">Need assistance?</p>
          <p>Links are valid for 24 hours. Once verified, you will be redirected automatically to your account.</p>
        </div>

        <Link
          href={`/login${redirectTo !== "/account" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          className="inline-flex w-full py-3 px-4 rounded-lg bg-primary text-on-primary font-title-md text-sm font-semibold tracking-wide hover:bg-primary-container transition-all items-center justify-center gap-2 shadow-sm"
        >
          <span>Return to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Atelier Membership
        </div>
        <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
          Create Your Account
        </h1>
        <p className="font-body-md text-on-surface-variant mt-2 text-sm">
          Join Vélure Atelier to acquire limited capsule drops and manage delivery preferences.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 shadow-sm">
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration failed</p>
              <p className="text-xs mt-0.5 leading-relaxed">{authError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="name"
                placeholder="Priya Sundaram"
                {...register("fullName")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.fullName
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant/60 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-error mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                autoComplete="email"
                placeholder="priya@example.com"
                {...register("email")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.email
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant/60 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-error mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Mobile Number (for delivery SMS) <span className="text-xs text-on-surface-variant/70 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                autoComplete="tel"
                placeholder="9820144521"
                {...register("phone")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.phone
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant/60 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-error mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Password <span className="text-xs text-on-surface-variant/70 font-normal">(Min 8 chars, letter & number)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.password
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant/60 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-error mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
                  errors.confirmPassword
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-outline-variant/60 focus:border-primary focus:ring-primary"
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-error mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 mt-2 rounded-lg bg-primary text-on-primary font-title-md text-sm font-semibold tracking-wide hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Membership...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
          <p className="text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href={`/login${redirectTo !== "/account" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-primary font-semibold hover:underline"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="w-full min-h-[calc(100vh-16rem)] flex items-center justify-center px-6 py-16 bg-surface">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}
