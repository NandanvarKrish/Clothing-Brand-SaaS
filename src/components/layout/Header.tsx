"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { AnnouncementBar } from "./AnnouncementBar";

export function Header() {
  const pathname = usePathname();
  const { itemCount: cartCount, openCart } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop All", href: "/shop" },
    { label: "New Arrivals", href: "/shop?filter=new-arrivals" },
    { label: "Bestsellers", href: "/shop?filter=bestsellers" },
    { label: "Collections", href: "/collections" },
    { label: "About", href: "/about" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-outline-variant/30">
      <AnnouncementBar />

      <div className="h-20 w-full max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-8">
        {/* Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="xl:hidden p-1 text-on-surface-variant hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link href="/" className="flex flex-col group">
            <span className="font-display-lg text-display-lg-mobile lg:text-headline-lg tracking-tight uppercase text-primary font-bold leading-none transition-colors group-hover:text-secondary">
              Vélure Atelier
            </span>
            <span className="font-label-sm text-label-sm tracking-[0.25em] text-on-surface-variant uppercase mt-1">
              Maison de Couture
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-title-md text-title-md transition-colors ${
                  active
                    ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Action Icons */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Open search"
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1"
          >
            <Search className="w-[22px] h-[22px]" />
          </button>

          {/* Account Link */}
          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? "Patron Account" : "Sign In to Account"}
            className="text-on-surface-variant hover:text-primary transition-colors hidden sm:flex items-center justify-center p-1"
          >
            <User className="w-[22px] h-[22px]" />
          </Link>

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            aria-label={`Wishlist (${wishlistCount} items)`}
            className="text-on-surface-variant hover:text-primary transition-colors relative flex items-center justify-center p-1"
          >
            <Heart className="w-[22px] h-[22px]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-on-secondary font-label-sm text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Shopping Bag Button (Opens Drawer) */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Shopping Bag (${cartCount} items)`}
            className="text-on-surface-variant hover:text-primary transition-colors relative flex items-center justify-center p-1"
          >
            <ShoppingBag className="w-[22px] h-[22px]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-primary text-on-primary font-label-sm text-[10px] h-4 px-1.5 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Brand Atelier Seal / Patron Avatar */}
          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? `Signed in as ${profile?.fullName || user.email}` : "Sign In"}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-primary-container transition-colors"
          >
            {user
              ? profile?.fullName
                ? profile.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "PA"
              : "VA"}
          </Link>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {isSearchOpen && (
        <div className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-3 px-6 lg:px-12 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garments by name, weave, or fiber (e.g. Linen Chore Jacket, Raw Silk, Khadi)..."
              className="flex-1 bg-transparent border-none text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-body-md text-body-md"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold hover:bg-primary-container transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-1 text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-full bg-surface-container-lowest border-b border-outline-variant/40 shadow-xl p-6 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg font-title-md text-title-md transition-colors ${
                  isActive(link.href)
                    ? "bg-surface-container text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={user ? "/account" : "/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg font-title-md text-title-md transition-colors ${
                pathname.startsWith("/account") || pathname === "/login"
                  ? "bg-surface-container text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              {user ? `Account (${profile?.fullName || "Patron"})` : "Sign In / Register"}
            </Link>
          </nav>
          <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between text-body-sm text-on-surface-variant">
            <span>India (INR ₹)</span>
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-secondary font-semibold hover:underline"
            >
              Concierge Desk
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
