"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/account?message=Your+password+has+been+successfully+updated.");
      }, 2000);
    } catch (err: any) {
      setAuthError(err?.message || "An unexpected error occurred while updating password.");
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
            Set New Password
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2 text-sm">
            Please choose a strong password with at least 8 characters including letters and numbers.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 shadow-sm">
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Update failed</p>
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
                Password Updated
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Your new password has been established securely. Redirecting to your account dashboard...
              </p>
              <div className="pt-2">
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary font-title-md text-sm font-semibold hover:bg-primary-container transition-colors"
                >
                  <span>Go to Account Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
                  New Password <span className="text-xs text-on-surface-variant/70 font-normal">(Min 8 chars, letter & number)</span>
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
                  Confirm New Password
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
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update Account Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
