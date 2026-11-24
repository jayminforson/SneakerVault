"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Small, dependency-free scroll-animation kit for the landing page.
// Everything degrades to static content when the user prefers reduced motion.

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fades/slides children in the first time they scroll into view. */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  variant?: "up" | "left" | "right" | "zoom" | "fade";
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal reveal-${variant} ${shown ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Tracks how far an element has travelled through the viewport:
 * 0 when its top meets the bottom of the screen, 1 when its bottom meets the
 * top. Updates once per animation frame while scrolling.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return [ref, progress] as const;
}

/** Moves children vertically at a different speed to the page. */
export function Parallax({
  children,
  speed = 0.2,
  className = "",
  style,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [ref, progress] = useScrollProgress<HTMLDivElement>();
  const shift = (progress - 0.5) * speed * -400;
  return (
    <div ref={ref} className={className} style={{ ...style, transform: `translate3d(0, ${shift}px, 0)`, willChange: "transform" }}>
      {children}
    </div>
  );
}

/** A big line of text that slides sideways as the page scrolls. */
export function ScrollMarqueeText({ text, reverse = false, className = "" }: { text: string; reverse?: boolean; className?: string }) {
  const [ref, progress] = useScrollProgress<HTMLDivElement>();
  const x = (reverse ? 1 - progress : progress) * -40;
  return (
    <div ref={ref} className="overflow-hidden whitespace-nowrap select-none" aria-hidden="true">
      <div className={className} style={{ transform: `translate3d(${x}%, 0, 0)`, willChange: "transform" }}>
        {Array.from({ length: 4 }, () => text).join("  ·  ")}
      </div>
    </div>
  );
}
