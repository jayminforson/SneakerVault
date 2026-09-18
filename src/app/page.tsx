"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Sneaker {
  id: string; name: string; brand: string; price: number;
  originalPrice?: number; heroImage: string; tags: string[];
  colors: { name: string; hex: string }[];
}

export default function Home() {
  const [sneakers, setSneakers] = useState<Sneaker[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("popular");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/sneakers").then(r => r.json()).then(data => {
      setSneakers(data);
      setLoaded(true);
    });
  }, []);

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
      return 0;
    });

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-light.png" alt="SneakerVault" className="h-10 w-10 rounded-lg object-cover" />
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
        <p className="text-gray-500 mt-2 sm:mt-3 text-sm sm:text-base">Pay with MTN Mobile Money. Get your receipt by email.</p>
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
                  <img src={s.heroImage} alt={s.name} className="w-full h-full object-cover img-zoom" />
                  {s.originalPrice && (
                    <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {Math.round((1 - s.price / s.originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{s.brand}</p>
                <p className="text-sm font-medium mt-0.5 truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold">GH₵ {s.price.toFixed(2)}</span>
                  {s.originalPrice && <span className="text-xs text-gray-400 line-through">GH₵ {s.originalPrice.toFixed(2)}</span>}
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
