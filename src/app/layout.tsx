import type { Metadata } from "next";
import "./globals.css";

// The favicon comes from the src/app/icon.png file convention, which serves it
// at an absolute /icon.png. A metadata.icons entry would emit a relative
// ./icon.png that resolves to /admin/icon.png on nested routes.
export const metadata: Metadata = {
  title: "SneakerVault",
  description: "Shop premium sneakers. Pay securely with Paystack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
