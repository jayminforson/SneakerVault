"use client";

import Link from "next/link";
import Image from "next/image";
import { CURRENCY_SYMBOL } from "@/lib/config";

export interface ProductCardData {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  heroImage: string;
  hoverImage?: string;
  rating: number;
  reviewCount: number;
  colors: { name: string; hex: string }[];
}

// Catalogue names were imported as "[ adidas Samba OG ]"; strip the brackets
// for display without touching the stored value.
export function displayName(name: string): string {
  return name.replace(/^\s*\[\s*/, "").replace(/\s*\]\s*$/, "");
}

// Shop-grid card. When the product has a second gallery shot it sits under the
// hero and cross-fades in on hover, so shoppers see another angle without
// opening the product page.
export default function ProductCard({
  sneaker: s,
  onQuickAdd,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
}: {
  sneaker: ProductCardData;
  onQuickAdd?: () => void;
  sizes?: string;
  priority?: boolean;
}) {
  const onSale = !!s.originalPrice && s.originalPrice > s.price;
  const name = displayName(s.name);

  return (
    <div className="group card-hover">
      <Link href={`/sneaker?id=${encodeURIComponent(s.id)}`} className="block">
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
          <Image
            src={s.heroImage}
            alt={name}
            fill
            sizes={sizes}
            priority={priority}
            className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
              s.hoverImage ? "group-hover:opacity-0" : ""
            }`}
          />
          {s.hoverImage && (
            <Image
              src={s.hoverImage}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
              className="object-cover opacity-0 scale-105 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100"
            />
          )}
          {onSale && (
            <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {Math.round((1 - s.price / s.originalPrice!) * 100)}% OFF
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{s.brand}</p>
        <p className="text-sm font-medium mt-0.5 truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold">{CURRENCY_SYMBOL} {s.price.toFixed(2)}</span>
          {onSale && (
            <span className="text-xs text-gray-400 line-through">{CURRENCY_SYMBOL} {s.originalPrice!.toFixed(2)}</span>
          )}
        </div>
        {/* Imported pairs have no reviews yet — hiding the row beats
            showing an empty "0 reviews" to every shopper. */}
        {s.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
            <span className="font-medium text-gray-700">{s.rating.toFixed(1)}</span>
            <span>· {s.reviewCount} review{s.reviewCount === 1 ? "" : "s"}</span>
          </div>
        )}
        {s.colors?.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {s.colors.slice(0, 4).map((c, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        )}
      </Link>
      {onQuickAdd && (
        <button
          onClick={onQuickAdd}
          className="mt-2 w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-black hover:text-white hover:border-black transition-all duration-200 active:scale-[0.98]"
        >
          + Add
        </button>
      )}
    </div>
  );
}
