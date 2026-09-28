"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CURRENCY_SYMBOL, paymentMethodsSentence } from "@/lib/config";

interface Sneaker {
  id: string; name: string; brand: string; price: number;
  originalPrice?: number; heroImage: string; tags: string[];
  rating: number; reviewCount: number;
  colors: { name: string; hex: string }[];
}

export default function Home() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("popular");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sneakers")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error("unexpected payload");
        setSneakers(data);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded(true);
          setLoadError(true);
        }
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const brands = ["All", ...Array.from(new Set(sneakers.map(s => s.brand)))];

  const filtered = sneakers
    .filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.brand.toLowerCase().includes(q)) return false;
      }
      if (brand !== "All" && s.brand !== brand) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      // "Popular": most-reviewed first, better-rated first on a tie.
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return b.rating - a.rating;
    });

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-light.png" alt="SneakerVault" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight">SneakerVault</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:inline">No account needed</span>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Admin</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-6 sm:pb-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Find your pair.</h1>
        <p className="text-gray-500 mt-2 sm:mt-3 text-sm sm:text-base">Pay securely with {paymentMethodsSentence()}. Receipt by email.</p>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search sneakers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            />
          </div>
          <select value={brand} onChange={e => setBrand(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer">
            {brands.map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer">
            <option value="popular">Popular</option>
            <option value="price-low">Price: Low</option>
            <option value="price-high">Price: High</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <p className="text-xs text-gray-400 mb-4">{filtered.length} results</p>

        {!loaded ? (
          /* Skeleton loading */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="space-y-3">
                <div className="aspect-square skeleton rounded-xl" />
                <div className="h-3 skeleton w-16 rounded" />
                <div className="h-4 skeleton w-3/4 rounded" />
                <div className="h-3 skeleton w-20 rounded" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">😕</div>
            <p className="text-gray-500 text-sm">We couldn&apos;t load the catalogue.</p>
            <button
              onClick={() => { setLoadError(false); setLoaded(false); setReloadKey((k) => k + 1); }}
              className="mt-3 text-xs text-black underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">👟</div>
            <p className="text-gray-400 text-sm">No sneakers found.</p>
            <button onClick={() => { setSearch(""); setBrand("All"); }} className="mt-3 text-xs text-black underline hover:no-underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 stagger-children">
            {filtered.map(s => (
              <Link key={s.id} href={`/sneaker?id=${s.id}`} className="group card-hover">
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                  <Image
                    src={s.heroImage}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover img-zoom"
                  />
                  {s.originalPrice && (
                    <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {Math.round((1 - s.price / s.originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{s.brand}</p>
                <p className="text-sm font-medium mt-0.5 truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold">{CURRENCY_SYMBOL} {s.price.toFixed(2)}</span>
                  {s.originalPrice && <span className="text-xs text-gray-400 line-through">{CURRENCY_SYMBOL} {s.originalPrice.toFixed(2)}</span>}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                  <span className="font-medium text-gray-700">{s.rating.toFixed(1)}</span>
                  <span>· {s.reviewCount} review{s.reviewCount === 1 ? "" : "s"}</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {s.colors?.slice(0, 4).map((c, i) => (
                    <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
