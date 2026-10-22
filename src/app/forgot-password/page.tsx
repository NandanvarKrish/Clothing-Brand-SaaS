"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setIsSuccess(true);
    } catch (err: any) {
      setAuthError(err?.message || "An unexpected error occurred while requesting password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-16rem)] flex items-center justify-center px-6 py-16 bg-surface">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Security Concierge
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
            Recover Account Password
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2 text-sm">
            Enter your email to receive a secure link to reset your account password.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 shadow-sm">
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reset request failed</p>
                <p className="text-xs mt-0.5 leading-relaxed">{authError}</p>
              </div>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-headline-sm text-headline-sm font-serif text-primary">
                Instructions Dispatched
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                If an account exists with that email, we have dispatched a password reset link. Please check your inbox and follow the link to establish a new password.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-surface-container text-primary font-title-md text-sm font-semibold hover:bg-surface-container-high transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-primary text-on-primary font-title-md text-sm font-semibold tracking-wide hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Remember password? Return to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
