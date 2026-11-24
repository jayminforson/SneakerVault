"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CURRENCY_SYMBOL } from "@/lib/config";

export interface HeroShoe {
  id: string;
  name: string;
  brand: string;
  price: number | null;
  image: string;
  width: number;
  height: number;
  accent: string;
}

const AUTO_ADVANCE_MS = 5500;
const SWIPE_THRESHOLD = 70;

// Home page hero: a background-free sneaker floating over a soft tinted
// backdrop, with liquid-glass controls.
//
//  - Move the pointer and the pair tilts in 3D toward it, its shadow sliding
//    the other way.
//  - Drag / swipe sideways (or use the arrow keys) to change pairs; the shoe
//    follows your finger and springs back if the swipe is short.
//  - Scrolling away lifts and turns the pair slightly.
//
// All per-frame motion is written straight to the DOM from one rAF loop so
// React only re-renders when the active pair changes.
export default function Hero({ shoes, headline, subline }: { shoes: HeroShoe[]; headline: string; subline: string }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shoeRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // Motion state, mutated outside React.
  const motion = useRef({ tx: 0, ty: 0, cx: 0, cy: 0, drag: 0, dragStart: null as number | null, dragged: false, reduced: false });

  const count = shoes.length;
  const go = useCallback((delta: 1 | -1) => {
    if (count < 2) return;
    setDirection(delta);
    setActive((i) => (i + delta + count) % count);
  }, [count]);

  const select = (i: number) => {
    if (i === active) return;
    setDirection(i > active ? 1 : -1);
    setActive(i);
  };

  // Auto-advance, paused while the visitor is interacting.
  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => go(1), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [active, paused, count, go]);

  // The animation loop.
  useEffect(() => {
    const m = motion.current;
    m.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (sectionRef.current) io.observe(sectionRef.current);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      const shoe = shoeRef.current;
      const shadow = shadowRef.current;
      const section = sectionRef.current;
      if (!shoe || !shadow || !section) return;

      // Ease the tilt toward its target for a weighty, smooth feel.
      m.cx += (m.tx - m.cx) * 0.08;
      m.cy += (m.ty - m.cy) * 0.08;
      if (m.dragStart === null) m.drag += (0 - m.drag) * 0.15;

      const rect = section.getBoundingClientRect();
      const scroll = m.reduced ? 0 : Math.min(1, Math.max(0, -rect.top / rect.height));
      const tiltX = m.reduced ? 0 : m.cx;
      const tiltY = m.reduced ? 0 : m.cy;

      shoe.style.transform =
        `translate3d(${m.drag + tiltX * 14}px, ${tiltY * 8 - scroll * 120}px, 0) ` +
        `rotate(${-6 + m.drag * 0.025 - scroll * 10}deg) ` +
        `rotateY(${tiltX * 14}deg) rotateX(${-tiltY * 10}deg) scale(${1 - scroll * 0.12})`;
      shadow.style.transform = `translate3d(${-tiltX * 18 + m.drag * 0.6}px, 0, 0) scale(${1 - Math.abs(tiltY) * 0.08 - scroll * 0.4}, 1)`;
      shadow.style.opacity = String(Math.max(0, 1 - scroll * 2.5 - Math.abs(m.drag) / 400));
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); io.disconnect(); };
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    const m = motion.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (m.dragStart !== null) {
      m.drag = e.clientX - m.dragStart;
      // Capture only once it is clearly a drag, so a plain tap on the shoe
      // still reaches its link.
      if (!m.dragged && Math.abs(m.drag) > 6) {
        m.dragged = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }
    if (e.pointerType === "mouse") {
      m.tx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      m.ty = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const m = motion.current;
    m.dragStart = e.clientX - m.drag;
    m.dragged = false;
    setPaused(true);
  };

  const endDrag = (e: React.PointerEvent) => {
    const m = motion.current;
    if (m.dragStart === null) return;
    m.dragStart = null;
    // Touch has no mouseleave to resume the slideshow, so resume here.
    if (e.pointerType !== "mouse") setPaused(false);
    if (m.drag <= -SWIPE_THRESHOLD) { m.drag = 0; go(1); }
    else if (m.drag >= SWIPE_THRESHOLD) { m.drag = 0; go(-1); }
  };

  if (count === 0) return null;
  const shoe = shoes[active];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#f5f5f7]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); motion.current.tx = 0; motion.current.ty = 0; }}
    >
      {/* Tinted light that follows the active pair's colour */}
      <div
        className="pointer-events-none absolute left-1/2 top-[58%] h-[34rem] w-[34rem] sm:h-[44rem] sm:w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[90px] transition-colors duration-1000"
        style={{ backgroundColor: shoe.accent }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-14 flex flex-col items-center text-center">
        <h1 className="hero-line text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-900">{headline}</h1>
        <p className="hero-line [animation-delay:100ms] mt-3 sm:mt-4 max-w-xl text-base sm:text-lg text-gray-500">{subline}</p>
        <div className="hero-line [animation-delay:200ms] mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 btn-press">
            Shop all sneakers
          </Link>
          <a href="#deals" className="glass rounded-full px-6 py-3 text-sm font-semibold text-gray-900 btn-press">
            View deals
          </a>
        </div>

        {/* Stage */}
        <div
          ref={stageRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured sneakers"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { setPaused(true); go(1); }
            if (e.key === "ArrowLeft") { setPaused(true); go(-1); }
          }}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative mt-6 sm:mt-4 w-full max-w-3xl h-[260px] sm:h-[400px] lg:h-[440px] select-none touch-pan-y cursor-grab active:cursor-grabbing [perspective:1400px] focus-visible:outline-none"
        >
          {/* Big faded brand word behind the pair */}
          <div key={`word-${shoe.id}`} aria-hidden="true" className="absolute inset-0 flex items-center justify-center animate-fade-in">
            <span className="text-[22vw] sm:text-[11rem] lg:text-[13rem] font-semibold tracking-tighter text-black/[0.035] leading-none whitespace-nowrap">
              {shoe.brand.split(" ")[0]}
            </span>
          </div>

          {/* Contact shadow */}
          <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[62%]">
            <div ref={shadowRef} className="h-6 sm:h-8 w-full rounded-[50%] bg-black/25 blur-xl" />
          </div>

          <div ref={shoeRef} className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d] will-change-transform">
            <div key={shoe.id} className={`w-[88%] sm:w-[80%] ${direction === 1 ? "shoe-enter-right" : "shoe-enter-left"}`}>
              <div className="animate-float-soft">
                <Link
                  href={`/sneaker?id=${encodeURIComponent(shoe.id)}`}
                  draggable={false}
                  onClick={(e) => { if (motion.current.dragged) e.preventDefault(); }}
                  aria-label={`View ${shoe.name}`}
                  className="block"
                >
                  <Image
                    src={shoe.image}
                    alt={shoe.name}
                    width={shoe.width}
                    height={shoe.height}
                    priority={active === 0}
                    draggable={false}
                    sizes="(max-width: 640px) 88vw, 620px"
                    className="w-full h-auto drop-shadow-[0_30px_35px_rgba(0,0,0,0.18)] pointer-events-none"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Glass controls */}
        <div className="mt-2 sm:mt-0 w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div key={`info-${shoe.id}`} className="glass rounded-2xl px-4 py-3 flex items-center gap-4 text-left animate-fade-in w-full sm:w-auto">
            <div className="min-w-0 flex-1 sm:max-w-[16rem]">
              <p className="text-[11px] uppercase tracking-wider font-medium text-gray-500">{shoe.brand}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{shoe.name}</p>
            </div>
            {shoe.price !== null && (
              <span className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">{CURRENCY_SYMBOL} {shoe.price.toFixed(0)}</span>
            )}
            <Link href={`/sneaker?id=${encodeURIComponent(shoe.id)}`} className="shrink-0 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800">
              View
            </Link>
          </div>

          <div className="glass rounded-full p-1 flex items-center gap-1">
            <button onClick={() => { setPaused(true); go(-1); }} aria-label="Previous sneaker" className="h-9 w-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-white/70 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative flex items-center gap-1 [--step:44px] sm:[--step:52px]">
              {/* Sliding glass lens behind the selected thumbnail */}
              <span
                aria-hidden="true"
                className="absolute top-0 h-9 w-10 sm:w-12 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,1)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ transform: `translateX(calc(${active} * var(--step)))` }}
              />
              {shoes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setPaused(true); select(i); }}
                  aria-label={s.name}
                  aria-current={i === active}
                  className="relative h-9 w-10 sm:w-12 flex items-center justify-center rounded-full"
                >
                  <Image src={s.image} alt="" width={s.width} height={s.height} sizes="48px" className={`w-8 sm:w-9 h-auto transition-all duration-300 ${i === active ? "scale-110" : "opacity-60 hover:opacity-100"}`} />
                </button>
              ))}
            </div>
            <button onClick={() => { setPaused(true); go(1); }} aria-label="Next sneaker" className="h-9 w-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-white/70 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 hidden sm:block">Drag the pair or use ← → to explore</p>
        <p className="mt-4 text-xs text-gray-400 sm:hidden">Swipe to explore</p>
      </div>
    </section>
  );
}
