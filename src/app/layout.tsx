import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SneakerVault",
  description: "Shop premium sneakers. Pay with MTN Mobile Money.",
  icons: {
    icon: "./icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
