"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SeasonalSale } from "@/lib/promos";
import { Reveal, ScrollMarqueeText } from "./motion";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { label: "Days", value: Math.floor(s / 86400) },
    { label: "Hrs", value: Math.floor((s % 86400) / 3600) },
    { label: "Min", value: Math.floor((s % 3600) / 60) },
    { label: "Sec", value: s % 60 },
  ];
}

// Seasonal sale strip with a live countdown. Renders nothing once the sale
// has ended, so a stale "Black Friday" banner never lingers into January.
export default function SaleBanner({ sale }: { sale: SeasonalSale }) {
  const start = Date.parse(sale.start);
  const end = Date.parse(sale.end);
  // null until mounted: the server's clock would otherwise disagree with the
  // browser's and trip a hydration mismatch.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);

  if (now !== null && now >= end) return null;
  const live = now !== null && now >= start;
  const target = live ? end : start;

  return (
    <section id="deals" className="relative overflow-hidden bg-black text-white py-16 sm:py-24 scroll-mt-14">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
        <ScrollMarqueeText
          text={sale.label.toUpperCase()}
          className="text-[18vw] font-black leading-none tracking-tighter text-white/[0.06]"
        />
      </div>
      <div className="relative">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <Reveal variant="left">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
              {live ? "Live now" : "Coming soon"} · {sale.label}
            </span>
            <h2 className="mt-4 text-4xl sm:text-6xl font-black tracking-tighter leading-[0.95]">{sale.headline}</h2>
            <p className="mt-4 max-w-lg text-sm sm:text-base text-white/60">{sale.subline}</p>
            <Link
              href={sale.cta.href}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {sale.cta.label}
            </Link>
          </Reveal>
          <Reveal variant="right" delay={150}>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">{live ? "Ends in" : "Starts in"}</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {parts(now === null ? 0 : target - now).map((part) => (
                <div key={part.label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-2 py-4 text-center">
                  <div className="text-3xl sm:text-5xl font-black tabular-nums" suppressHydrationWarning>
                    {now === null ? "--" : String(part.value).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{part.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
