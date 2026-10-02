"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-context";

// Shared top bar. The storefront and the product page previously duplicated
// this markup, which is why the cart badge now lives in one place.
export default function SiteNav({ children }: { children?: React.ReactNode }) {
  const { count } = useCart();

  return (
    <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-light.png"
            alt="SneakerVault"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <span className="text-lg font-bold tracking-tight">SneakerVault</span>
        </Link>

        <div className="flex items-center gap-4">
          {children}
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
                data-cart-badge
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
