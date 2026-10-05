import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import SiteFooter from "@/components/site-footer";

// The favicon comes from the src/app/icon.png file convention, which serves it
// at an absolute /icon.png. A metadata.icons entry would emit a relative
// ./icon.png that resolves to /admin/icon.png on nested routes.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.sneakervault.live"),
  title: { default: "SneakerVault", template: "%s · SneakerVault" },
  description: "Shop premium sneakers. Pay securely with Paystack.",
  openGraph: {
    title: "SneakerVault",
    description: "Shop premium sneakers. Pay securely with Paystack.",
    url: "https://www.sneakervault.live",
    siteName: "SneakerVault",
    images: ["/logo-light.png"],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SneakerVault",
    description: "Shop premium sneakers. Pay securely with Paystack.",
    images: ["/logo-light.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">
        <CartProvider>
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
