import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vélure Atelier | Artisanal Clothing & Quiet Luxury",
  description:
    "An artisanal dialogue between heritage loom craftsmanship and quiet luxury silhouettes. Handcrafted everyday essentials in small-batch editions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="bg-surface font-sans text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
        <CartProvider>
          <WishlistProvider>
            <Header />
            <div className="flex-1 pt-28">
              {children}
            </div>
            <CartDrawer />
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
