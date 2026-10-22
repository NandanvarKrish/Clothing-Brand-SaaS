"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { CustomerProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: CustomerProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserSupabaseClient();

  const fetchProfileForUser = useCallback(
    async (currentUser: User): Promise<CustomerProfile> => {
      try {
        const { data, error } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            fullName: data.full_name || currentUser.user_metadata?.full_name || "",
            email: data.email || currentUser.email || "",
            phone: data.phone || currentUser.user_metadata?.phone || "",
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        // Fallback gracefully if database table not yet created
      }

      // Metadata fallback
      return {
        userId: currentUser.id,
        fullName:
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "Atelier Patron",
        email: currentUser.email || "",
        phone: currentUser.user_metadata?.phone || "",
        createdAt: currentUser.created_at,
      };
    },
    [supabase]
  );

  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        const p = await fetchProfileForUser(currentUser);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProfileForUser]);

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfileForUser(session.user);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser, fetchProfileForUser]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.email) return { success: false, error: "No email address found" };
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to resend verification email" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        refreshUser,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
