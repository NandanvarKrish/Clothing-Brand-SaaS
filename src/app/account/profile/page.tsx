"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User as UserIcon,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { profileSchema, ProfileFormData } from "@/lib/validations/auth";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const { user, profile, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // 1. Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phone || null,
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        return;
      }

      // 2. Try to update customer_profiles table if it exists
      if (user) {
        try {
          await supabase
            .from("customer_profiles")
            .upsert({
              user_id: user.id,
              full_name: data.fullName,
              phone: data.phone || null,
              email: user.email!,
            })
            .eq("user_id", user.id);
        } catch (dbErr) {
          // Graceful fallback if table is not yet migrated
        }
      }

      await refreshUser();
      setSuccessMessage("Your atelier profile information has been saved successfully.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailConfirmed = Boolean(user?.email_confirmed_at);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm font-serif text-primary">
          Atelier Profile Details
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage your personal identifiers and contact coordinates used for private client communications.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 shadow-sm">
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-3 text-secondary text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email (Read Only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant font-medium">
                Email Address
              </label>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isEmailConfirmed
                    ? "bg-secondary/10 text-secondary"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {isEmailConfirmed ? "Verified" : "Pending Verification"}
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-on-surface-variant/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container text-on-surface-variant/80 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              Your email is used for order confirmations and authentication.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
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

          {/* Phone */}
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant font-medium mb-1.5">
              Contact Phone (for delivery concierge SMS)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="py-2.5 px-5 rounded-lg bg-primary text-on-primary font-title-sm text-sm font-semibold tracking-wide hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
