"use client";

import React, { useState } from "react";
import { MessageCircle, Mail, MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="w-full max-w-[1200px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-semibold block mb-2">
          Concierge &amp; Customer Care
        </span>
        <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-primary font-bold tracking-tight">
          Connect with the Atelier
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 leading-relaxed">
          Whether you require bespoke hemming measurements, private capsule styling, or order tracking assistance, our concierge team is at your disposal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7">
          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-in-stock-bg text-in-stock flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-headline-md text-headline-md text-primary font-semibold">
                  Inquiry Dispatched
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
                  Thank you, {formData.name || "Patron"}. Our concierge team will review your message and respond within 4 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", phone: "", orderNumber: "", message: "" });
                  }}
                  className="px-6 py-2.5 rounded bg-primary text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-2">
                  Send an Inquiry
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Priya Sundaram"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="priya@example.com"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                      Mobile Number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98201 44521"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                      Order Number (if applicable)
                    </label>
                    <input
                      type="text"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      placeholder="VEL-2024-XXXX"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Your Message or Sizing Query *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can our master tailors assist you today?"
                    className="w-full p-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md font-semibold uppercase tracking-wider shadow-md transition-colors"
                >
                  Submit Inquiry to Concierge
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Direct Channels & Studio */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Direct Banner */}
          <div className="p-6 rounded-2xl bg-[#ebf2ec] border border-[#386641]/20 space-y-3">
            <div className="flex items-center gap-2 text-[#386641] font-semibold font-title-md">
              <MessageCircle className="w-5 h-5" /> Instant WhatsApp Response
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Connect directly with our master tailors for instant fit advice, fabric photos in natural sunlight, or bespoke order placement.
            </p>
            <a
              href="https://wa.me/919820144521"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-[#386641] text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold hover:bg-[#386641]/90 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> Message on WhatsApp
            </a>
          </div>

          {/* Contact Details Card */}
          <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
            <h3 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-2">
              Boutique Headquarters
            </h3>

            <div className="flex items-start gap-3 text-body-md text-on-surface">
              <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary">Vélure Atelier Private Limited</p>
                <p className="text-on-surface-variant text-body-sm">
                  14B Seagull Arcade, Carter Road Promenade, Bandra West, Mumbai 400050, Maharashtra, India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-body-md text-on-surface">
              <Mail className="w-5 h-5 text-secondary shrink-0" />
              <p className="text-on-surface-variant text-body-sm">
                concierge@velureatelier.com
              </p>
            </div>

            <div className="flex items-center gap-3 text-body-md text-on-surface">
              <Phone className="w-5 h-5 text-secondary shrink-0" />
              <p className="text-on-surface-variant text-body-sm">
                +91 (022) 2640-8821 / +91 98201 44521
              </p>
            </div>

            <div className="flex items-start gap-3 text-body-md text-on-surface pt-2 border-t border-surface-container-high">
              <Clock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary text-body-sm">Concierge Operating Hours</p>
                <p className="text-on-surface-variant text-body-sm">
                  Monday – Saturday: 10:00 AM – 7:00 PM IST
                </p>
                <p className="text-on-surface-variant text-body-sm">
                  Sunday: Private Atelier Fittings by Appointment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
