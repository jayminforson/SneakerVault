"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard, { ProductCardData } from "@/components/product-card";
import QuickAdd, { QuickAddSeed } from "@/components/quick-add";

// Pinned horizontal gallery: the section is several screens tall, its inner
// track sticks to the viewport, and vertical scrolling slides the cards
// sideways. On small screens (or with reduced motion) it falls back to a
// plain swipeable row.
export default function TrendingScroller({ items }: { items: ProductCardData[] }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [height, setHeight] = useState<number | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddSeed | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const measure = () => {
      if (!desktop.matches || reduced.matches || !track.current) { setHeight(null); setX(0); return; }
      const distance = track.current.scrollWidth - window.innerWidth;
      setHeight(window.innerHeight + Math.max(0, distance));
      update();
    };
    const update = () => {
      frame = 0;
      const el = outer.current;
      const t = track.current;
      if (!el || !t || !desktop.matches || reduced.matches) return;
      const distance = Math.max(0, t.scrollWidth - window.innerWidth);
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), distance);
      setX(-scrolled);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    desktop.addEventListener("change", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      desktop.removeEventListener("change", measure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items.length]);

  if (items.length === 0) return null;
  const pinned = height !== null;

  return (
    <section ref={outer} className="relative bg-white" style={pinned ? { height } : undefined}>
      <div className={pinned ? "sticky top-0 h-screen flex flex-col justify-center overflow-hidden" : "py-16"}>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-rose-500">Trending now</p>
            <h2 className="mt-1 text-3xl sm:text-5xl font-black tracking-tighter">Most wanted pairs</h2>
          </div>
          <Link href="/shop" className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:no-underline">
            View all
          </Link>
        </div>
        <div className={pinned ? "" : "overflow-x-auto no-scrollbar snap-x snap-mandatory"}>
          <div
            ref={track}
            className="flex gap-5 px-4 sm:px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] w-max"
            style={pinned ? { transform: `translate3d(${x}px, 0, 0)`, willChange: "transform" } : undefined}
          >
            {items.map((s, i) => (
              <div key={s.id} className="w-[64vw] sm:w-64 md:w-72 shrink-0 snap-start">
                <div className="relative">
                  <span className="absolute -top-3 -left-2 z-10 text-5xl font-black text-gray-950/10 tabular-nums pointer-events-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ProductCard
                    sneaker={s}
                    sizes="(max-width: 768px) 64vw, 288px"
                    onQuickAdd={() => setQuickAdd({ id: s.id, name: s.name, brand: s.brand, price: s.price, heroImage: s.heroImage })}
                  />
                </div>
              </div>
            ))}
            <Link
              href="/shop"
              className="w-[64vw] sm:w-64 md:w-72 shrink-0 snap-start aspect-square rounded-xl bg-gray-950 text-white flex flex-col items-center justify-center gap-3 group"
            >
              <span className="text-2xl font-black tracking-tight">See the full vault</span>
              <span className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
      {quickAdd && <QuickAdd key={quickAdd.id} seed={quickAdd} onClose={() => setQuickAdd(null)} />}
    </section>
  );
}
