"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/site-nav";
import ProductCard, { ProductCardData } from "@/components/product-card";
import QuickAdd, { QuickAddSeed } from "@/components/quick-add";
import Pagination from "@/components/pagination";
import { paymentMethodsSentence } from "@/lib/config";

const PAGE_SIZE = 24;

interface PageResponse {
  items: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ShopPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-6 animate-fade-in">
        <p className="text-xs uppercase tracking-widest font-semibold text-gray-400">The Vault</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mt-1">Shop all sneakers</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Pay securely with {paymentMethodsSentence()}. Receipt by email.</p>
      </div>
      {/* useSearchParams() needs a Suspense boundary to prerender. */}
      <Suspense fallback={<GridSkeleton withFilters />}>
        <Catalog />
      </Suspense>
    </div>
  );
}

function GridSkeleton({ withFilters = false }: { withFilters?: boolean }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
      {withFilters && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="h-10 flex-1 skeleton rounded-xl" />
          <div className="h-10 w-32 skeleton rounded-xl" />
          <div className="h-10 w-36 skeleton rounded-xl" />
        </div>
      )}
      <div className="h-3 w-20 skeleton rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square skeleton rounded-xl" />
            <div className="h-3 skeleton w-16 rounded" />
            <div className="h-4 skeleton w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Catalog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const gridTop = useRef<HTMLDivElement>(null);

  // The URL is the single source of truth, so page links, the back button and
  // shared links (e.g. /shop?brand=Nike&page=3) all land on the same view.
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const brand = searchParams.get("brand") ?? "";
  const sort = searchParams.get("sort") ?? "popular";
  const q = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(q);
  const [brands, setBrands] = useState<{ brand: string; count: number }[]>([]);
  const [data, setData] = useState<PageResponse | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Which request the current data/error belong to; anything else is loading.
  const requestKey = `${page}|${brand}|${sort}|${q}|${reloadKey}`;
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddSeed | null>(null);

  const setParams = (next: Record<string, string | number | null>, scrollToGrid = false) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "" || (key === "page" && value === 1) || (key === "sort" && value === "popular")) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    if (scrollToGrid) gridTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Keep the box in sync when the URL changes from elsewhere (back button).
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) { setSyncedQ(q); setSearch(q); }

  // Debounce typing into the URL; any new search starts from page 1.
  useEffect(() => {
    if (search.trim() === q) return;
    const t = setTimeout(() => setParams({ q: search.trim() || null, page: null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetch("/api/sneakers?brands=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => Array.isArray(list) && setBrands(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort });
    if (brand) params.set("brand", brand);
    if (q) params.set("q", q);
    const key = `${page}|${brand}|${sort}|${q}|${reloadKey}`;
    fetch(`/api/sneakers?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: PageResponse) => {
        if (!Array.isArray(json?.items)) throw new Error("unexpected payload");
        setData(json);
        setErrorKey(null);
        setSettledKey(key);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setErrorKey(key);
        setSettledKey(key);
      });
    return () => controller.abort();
  }, [page, brand, sort, q, reloadKey]);

  const loading = settledKey !== requestKey;
  const error = !loading && errorKey === requestKey;
  const totalPages = data?.totalPages ?? 1;
  const firstShown = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const lastShown = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <>
      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="search"
              placeholder="Search sneakers..."
              aria-label="Search sneakers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
            />
          </div>
          <select
            aria-label="Brand"
            value={brand}
            onChange={(e) => setParams({ brand: e.target.value || null, page: null })}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer"
          >
            <option value="">All brands</option>
            {brand && !brands.some((b) => b.brand === brand) && <option value={brand}>{brand}</option>}
            {brands.map((b) => (
              <option key={b.brand} value={b.brand}>{b.brand} ({b.count})</option>
            ))}
          </select>
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value, page: null })}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer"
          >
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low</option>
            <option value="price-high">Price: High</option>
          </select>
        </div>

        {/* Brand chips — quicker than the dropdown on mobile */}
        {brands.length > 0 && (
          <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar">
            {[{ brand: "", count: 0 }, ...brands].map((b) => {
              const active = b.brand === brand;
              return (
                <button
                  key={b.brand || "all"}
                  onClick={() => setParams({ brand: b.brand || null, page: null })}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {b.brand || "All"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div ref={gridTop} className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 scroll-mt-20">
        <p className="text-xs text-gray-400 mb-4 h-4">
          {data && !error && (data.total > 0
            ? `Showing ${firstShown}–${lastShown} of ${data.total}`
            : "0 results")}
        </p>

        {loading && !data ? (
          <GridSkeleton />
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">😕</div>
            <p className="text-gray-500 text-sm">We couldn&apos;t load the catalogue.</p>
            <button onClick={() => setReloadKey((k) => k + 1)} className="mt-3 text-xs text-black underline hover:no-underline">
              Try again
            </button>
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">👟</div>
            <p className="text-gray-400 text-sm">
              {data.total > 0 ? "This page is empty." : "No sneakers found."}
            </p>
            <button
              onClick={() => { setSearch(""); router.push(pathname, { scroll: false }); }}
              className="mt-3 text-xs text-black underline hover:no-underline"
            >
              {data.total > 0 ? "Back to page 1" : "Clear filters"}
            </button>
          </div>
        ) : data ? (
          <div
            key={`${page}-${brand}-${sort}-${q}`}
            className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 stagger-children transition-opacity ${loading ? "opacity-50" : ""}`}
          >
            {data.items.map((s, i) => (
              <ProductCard
                key={s.id}
                sneaker={s}
                priority={i < 4}
                onQuickAdd={() => setQuickAdd({ id: s.id, name: s.name, brand: s.brand, price: s.price, heroImage: s.heroImage })}
              />
            ))}
          </div>
        ) : null}

        {data && !error && totalPages > 1 && (
          <Pagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            hrefFor={(p) => {
              const params = new URLSearchParams(searchParams.toString());
              if (p === 1) params.delete("page"); else params.set("page", String(p));
              const qs = params.toString();
              return qs ? `${pathname}?${qs}` : pathname;
            }}
            onNavigate={() => gridTop.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
        )}

        <p className="mt-10 text-center text-xs text-gray-400">
          Looking for deals? <Link href="/#deals" className="underline hover:text-gray-900">See this week&apos;s promos</Link>
        </p>
      </div>

      {quickAdd && <QuickAdd key={quickAdd.id} seed={quickAdd} onClose={() => setQuickAdd(null)} />}
    </>
  );
}
