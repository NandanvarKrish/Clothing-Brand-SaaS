"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/account";
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");

  const { refreshUser } = useAuth();
  const [authError, setAuthError] = useState<string | null>(urlError);
  const [authSuccess, setAuthSuccess] = useState<string | null>(urlMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setAuthError(
            "Your email has not been verified yet. Please check your inbox for the confirmation link."
          );
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
          setAuthError("Invalid email or password. Please verify your credentials and try again.");
        } else {
          setAuthError(error.message);
        }
        return;
      }

      if (authData.session) {
        await refreshUser();
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setAuthError(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Patron Concierge
        </div>
        <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
          Sign In to Vélure
        </h1>
        <p className="font-body-md text-on-surface-variant mt-2 text-sm">
          Access your bespoke orders, saved atelier addresses, and private wishlist.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 shadow-sm">
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sign in failed</p>
              <p className="text-xs mt-0.5 leading-relaxed">{authError}</p>
            </div>
          </div>
        )}

        {authSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-3 text-secondary text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{authSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                placeholder="patron@example.com"
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-secondary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-lg bg-primary text-on-primary font-title-md text-sm font-semibold tracking-wide hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
          <p className="text-sm text-on-surface-variant">
            New to Vélure Atelier?{" "}
            <Link
              href={`/register${redirectTo !== "/account" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-primary font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="w-full min-h-[calc(100vh-16rem)] flex items-center justify-center px-6 py-16 bg-surface">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
