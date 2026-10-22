"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Plus,
  Trash2,
  Check,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addressSchema, AddressFormData } from "@/lib/validations/auth";
import { CustomerAddress } from "@/types";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    },
  });

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .order("is_default", { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: CustomerAddress[] = data.map((a: any) => ({
          id: a.id,
          customerId: a.customer_id,
          fullName: a.full_name,
          phone: a.phone,
          addressLine1: a.address_line1,
          addressLine2: a.address_line2,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: a.is_default,
        }));
        setAddresses(formatted);
        if (typeof window !== "undefined") {
          localStorage.setItem(`velure_addresses_${user.id}`, JSON.stringify(formatted));
        }
      } else {
        // Fallback to local storage if DB empty or not yet migrated
        if (typeof window !== "undefined") {
          const local = localStorage.getItem(`velure_addresses_${user.id}`);
          if (local) {
            try {
              setAddresses(JSON.parse(local));
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn("Could not load remote addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openAddModal = () => {
    setEditingAddress(null);
    reset({
      fullName: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    reset({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const addressId = editingAddress?.id || `addr_${Date.now()}`;
      const newAddress: CustomerAddress = {
        id: addressId,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault,
      };

      // Try updating database if available
      try {
        if (data.isDefault) {
          await supabase
            .from("customer_addresses")
            .update({ is_default: false })
            .neq("id", addressId);
        }

        if (editingAddress) {
          await supabase
            .from("customer_addresses")
            .update({
              full_name: data.fullName,
              phone: data.phone,
              address_line1: data.addressLine1,
              address_line2: data.addressLine2 || null,
              city: data.city,
              state: data.state,
              pincode: data.pincode,
              is_default: data.isDefault,
            })
            .eq("id", addressId);
        } else {
          await supabase.from("customer_addresses").insert({
            id: addressId,
            full_name: data.fullName,
            phone: data.phone,
            address_line1: data.addressLine1,
            address_line2: data.addressLine2 || null,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            is_default: data.isDefault,
          });
        }
      } catch (dbErr) {
        // Fallback gracefully
      }

      // Update state and local storage
      let updatedList = editingAddress
        ? addresses.map((a) => (a.id === editingAddress.id ? newAddress : a))
        : [...addresses, newAddress];

      if (data.isDefault) {
        updatedList = updatedList.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }));
      }

      setAddresses(updatedList);
      if (typeof window !== "undefined") {
        localStorage.setItem(`velure_addresses_${user.id}`, JSON.stringify(updatedList));
      }

      setActionSuccess(
        editingAddress ? "Address updated successfully." : "New delivery address added."
      );
      setIsModalOpen(false);
    } catch (err: any) {
      setActionError(err?.message || "Failed to save address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    try {
      try {
        await supabase.from("customer_addresses").update({ is_default: false }).neq("id", id);
        await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
      } catch (e) {}

      const updated = addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      setAddresses(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(`velure_addresses_${user.id}`, JSON.stringify(updated));
      }
      setActionSuccess("Default address updated.");
    } catch (err) {
      setActionError("Failed to set default address.");
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return;
    try {
      try {
        await supabase.from("customer_addresses").delete().eq("id", id);
      } catch (e) {}

      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(`velure_addresses_${user.id}`, JSON.stringify(updated));
      }
      setActionSuccess("Address removed.");
    } catch (err) {
      setActionError("Failed to delete address.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-serif text-primary">
            Saved Delivery Coordinates
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your residential and atelier delivery destinations for priority courier dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-title-sm text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-3 text-secondary text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{actionSuccess}</p>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{actionError}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-12 text-center text-on-surface-variant">
          <MapPin className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="font-title-md text-title-md font-semibold text-primary">
            No Saved Delivery Addresses
          </h3>
          <p className="text-sm mt-1 max-w-sm mx-auto">
            Save your shipping addresses now to streamline future commission checkouts.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container text-primary font-title-sm text-xs font-semibold hover:bg-surface-container-high transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? "bg-surface-container-lowest border-primary/50 shadow-sm ring-1 ring-primary/20"
                  : "bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-semibold text-primary">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] uppercase font-bold tracking-wider">
                      Default Delivery
                    </span>
                  )}
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                  <br />
                  {addr.city}, {addr.state} — <span className="font-mono">{addr.pincode}</span>
                </p>

                <p className="text-xs text-on-surface-variant font-mono mt-3">
                  📞 +91 {addr.phone}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/30 text-xs">
                <div>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault(addr.id)}
                      className="text-secondary hover:underline font-semibold"
                    >
                      Set as default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-5">
              <h3 className="font-title-lg text-title-lg font-serif text-primary">
                {editingAddress ? "Edit Delivery Address" : "New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="Priya Sundaram"
                  {...register("fullName")}
                  className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary"
                />
                {errors.fullName && (
                  <p className="text-xs text-error mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  10-Digit Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="9820144521"
                  {...register("phone")}
                  className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary"
                />
                {errors.phone && (
                  <p className="text-xs text-error mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Street Address / Apartment
                </label>
                <input
                  type="text"
                  placeholder="14B Seagull Apt, Carter Road"
                  {...register("addressLine1")}
                  className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary"
                />
                {errors.addressLine1 && (
                  <p className="text-xs text-error mt-1">{errors.addressLine1.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Landmark / Locality (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Near Bandra Bandstand"
                  {...register("addressLine2")}
                  className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    {...register("city")}
                    className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary"
                  />
                  {errors.city && (
                    <p className="text-xs text-error mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    {...register("state")}
                    className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary"
                  />
                  {errors.state && (
                    <p className="text-xs text-error mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  6-Digit PIN Code
                </label>
                <input
                  type="text"
                  placeholder="400050"
                  {...register("pincode")}
                  className="w-full px-3.5 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-sm focus:outline-none focus:ring-1 focus:border-primary font-mono"
                />
                {errors.pincode && (
                  <p className="text-xs text-error mt-1">{errors.pincode.message}</p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  {...register("isDefault")}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs font-medium text-on-surface cursor-pointer">
                  Set as default delivery address for future commissions
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/60 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAddress ? "Save Changes" : "Save Address"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
