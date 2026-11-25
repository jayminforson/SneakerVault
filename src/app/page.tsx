import Link from "next/link";
import Image from "next/image";
import SiteNav from "@/components/site-nav";
import Hero, { HeroShoe } from "@/components/landing/hero";
import SaleBanner from "@/components/landing/sale-banner";
import TrendingScroller from "@/components/landing/trending-scroller";
import { Reveal, Parallax, ScrollMarqueeText } from "@/components/landing/motion";
import type { ProductCardData } from "@/components/product-card";
import { getSneakerPage, getSneakerById, type SneakerCard } from "@/lib/db";
import { BRAND_LOGOS, DEAL_TILES, FEATURED_BRANDS, HERO_SHOES, SEASONAL_SALE } from "@/lib/promos";
import { CURRENCY_SYMBOL, paymentMethodsSentence } from "@/lib/config";

// Rebuilt at most every five minutes, so the landing page is served as static
// HTML but still picks up new stock and price changes.
export const revalidate = 300;

const cleanName = (name: string) => name.replace(/^\s*\[\s*|\s*\]\s*$/g, "");
// Hero pairs always render — the cutouts are local files — and pick up their
// live name and price when the catalogue is reachable.
async function loadHeroShoes(): Promise<HeroShoe[]> {
  const live = await Promise.all(HERO_SHOES.map((h) => getSneakerById(h.id).catch(() => undefined)));
  return HERO_SHOES.map((h, i) => ({
    id: h.id,
    name: live[i] ? cleanName(live[i]!.name) : h.fallbackName,
    brand: live[i] ? brandLabel(live[i]!.brand) : "",
    price: live[i]?.price ?? null,
    image: h.image,
    width: h.width,
    height: h.height,
    accent: h.accent,
  }));
}

async function loadLanding() {
  const saleRunning = Date.now() < Date.parse(SEASONAL_SALE.end);
  try {
    const [trending, newest, ...brandPages] = await Promise.all([
      getSneakerPage({ page: 1, pageSize: 10, sort: "popular" }),
      getSneakerPage({ page: 1, pageSize: 4, sort: "newest" }),
      ...FEATURED_BRANDS.map((brand) => getSneakerPage({ page: 1, pageSize: 1, brand, sort: "popular" })),
    ]);
    return {
      saleRunning,
      total: trending.total,
      trending: trending.items,
      newest: newest.items,
      brands: FEATURED_BRANDS.map((brand, i) => ({ brand, count: brandPages[i].total, cover: brandPages[i].items[0] }))
        .filter((b) => b.cover),
    };
  } catch (error) {
    // A database hiccup should cost the page its product rails, not the page.
    console.error("Landing page could not read the catalogue:", error);
    return { saleRunning, total: 0, trending: [] as SneakerCard[], newest: [] as SneakerCard[], brands: [] };
  }
}

const brandLabel = (b: string) => (b === b.toUpperCase() ? b.charAt(0) + b.slice(1).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : b);

const PERKS = [
  { title: "Flat delivery", body: `${CURRENCY_SYMBOL} 25 anywhere in Ghana`, icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0h2m4 0h2v-4l-3-4h-5v8m-6 0a2 2 0 104 0m6 0a2 2 0 104 0" },
  { title: "Dispatched in 24h", body: "Orders processed within a day", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Secure checkout", body: `Pay with ${paymentMethodsSentence()} via Paystack`, icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { title: "7-day returns", body: "On unworn pairs", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
];

export default async function Home() {
  const [{ total, trending, newest, brands, saleRunning }, heroShoes] = await Promise.all([loadLanding(), loadHeroShoes()]);
  const cards: ProductCardData[] = trending;

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <Hero
        shoes={heroShoes}
        headline="Find your pair."
        subline={`${total > 0 ? `${total} pairs, ` : ""}delivered anywhere in Ghana for a flat ${CURRENCY_SYMBOL} 25. Pay securely with ${paymentMethodsSentence()}.`}
      />

      {/* Announcement strip — a quiet glass rail rather than a loud banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2">
        <div className="glass rounded-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee py-2.5 text-[13px] font-medium text-gray-600">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
                {[...(saleRunning ? [SEASONAL_SALE.headline] : []), "Combo deals", `Flat ${CURRENCY_SYMBOL} 25 delivery`, "Dispatched within 24 hours", "7-day returns", "Secure card payments"].map((t) => (
                  <span key={t} className="flex items-center gap-8 px-4">
                    {t} <span className="h-1 w-1 rounded-full bg-gray-300" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perks */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {PERKS.map((perk, i) => (
            <Reveal key={perk.title} delay={i * 90}>
              <div className="h-full rounded-2xl border border-gray-100 p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-gray-200">
                <div className="h-10 w-10 rounded-xl bg-gray-950 text-white flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={perk.icon} /></svg>
                </div>
                <h3 className="mt-4 text-sm font-bold">{perk.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{perk.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SaleBanner sale={SEASONAL_SALE} />

      {/* Deal tiles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <Reveal>
          <p className="text-xs uppercase tracking-widest font-semibold text-rose-500">Deals &amp; promos</p>
          <h2 className="mt-1 text-3xl sm:text-5xl font-black tracking-tighter">More pairs, less spend.</h2>
        </Reveal>

        {/* Combo deals — the big one */}
        <Reveal variant="zoom" className="mt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gray-950">
            <div className="relative z-10 grid gap-6 p-6 sm:p-10 sm:grid-cols-2 sm:items-center">
              <div>
                <span className="inline-block rounded-full bg-amber-300 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-950">Bundle &amp; save</span>
                <h3 className="mt-4 text-4xl sm:text-6xl font-black tracking-tighter text-white">COMBO DEALS</h3>
                <p className="mt-3 max-w-sm text-sm text-gray-300 sm:text-base">
                  Grab two (or three) pairs in one order and pay a single flat {CURRENCY_SYMBOL} 25 delivery fee.
                </p>
                <Link href="/shop" className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]">
                  Build your combo
                </Link>
              </div>
              <Parallax speed={0.15}>
                <Image src="/deals/combo-banner.png" alt="Combo deals on selected sneakers" width={800} height={355} className="h-auto w-full" />
              </Parallax>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {/* Combo Deals already has the big banner above. */}
          {DEAL_TILES.filter((t) => t.title !== "Combo Deals").map((tile, i) => (
            <Reveal key={tile.title} delay={i * 120} variant="up">
              <Link href={tile.href} className={`group relative block h-full overflow-hidden rounded-3xl p-7 sm:p-8 ${tile.theme}`}>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">{tile.eyebrow}</p>
                <h3 className="mt-3 text-3xl font-black tracking-tighter">{tile.title}</h3>
                <p className="mt-2 text-sm opacity-75">{tile.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
                  Shop now
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
                <span className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-current opacity-10 transition-transform duration-500 group-hover:scale-150" />
              </Link>
            </Reveal>
          ))}
          {newest[0] && (
            <Reveal delay={240} variant="up">
              <Link href={`/sneaker?id=${encodeURIComponent(newest[0].id)}`} className="group relative block h-full min-h-56 overflow-hidden rounded-3xl bg-gray-100">
                <Image src={newest[0].heroImage} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-7 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Just dropped</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight">{cleanName(newest[0].name)}</h3>
                  <p className="mt-1 text-sm font-semibold">{CURRENCY_SYMBOL} {newest[0].price.toFixed(2)}</p>
                </div>
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      <TrendingScroller items={cards} />

      {/* Shop by brand */}
      {brands.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-24 overflow-hidden">
          <ScrollMarqueeText text="SHOP BY BRAND" className="text-[14vw] font-black leading-none tracking-tighter text-gray-950/[0.05]" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-[6vw] relative">
            <Reveal>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">Pick your team.</h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {brands.map((b, i) => (
                <Reveal key={b.brand} delay={i * 100} variant="zoom">
                  <Link href={`/shop?brand=${encodeURIComponent(b.brand)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-gray-900">
                    <Image src={b.cover!.heroImage} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight">{brandLabel(b.brand)}</h3>
                      <p className="mt-0.5 text-xs text-white/70">{b.count} pairs</p>
                      <span className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-[-45deg]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Logo marquee */}
      <section className="py-12 border-y border-gray-100 overflow-hidden" aria-label="Brands we stock">
        <div className="flex w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {[0, 1, 2, 3].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-4 pr-4" aria-hidden={dup > 0}>
              {BRAND_LOGOS.map((entry) => (
                <Link
                  key={entry.brand}
                  href={`/shop?brand=${encodeURIComponent(entry.brand)}`}
                  tabIndex={dup > 0 ? -1 : undefined}
                  className="group flex h-16 w-40 items-center justify-center rounded-2xl border border-gray-100 bg-white transition-all hover:border-gray-300 hover:shadow-md"
                >
                  <Image src={entry.logo} alt={`${entry.brand} logo`} width={200} height={70} className="max-h-10 w-auto object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <Reveal variant="zoom">
          <h2 className="text-4xl sm:text-7xl font-black tracking-tighter leading-[0.95]">
            {total > 0 ? <>{total} pairs.<br />One vault.</> : <>Your next pair<br />is waiting.</>}
          </h2>
          <p className="mt-5 text-gray-500">Browse the full catalogue, page by page.</p>
          <Link href="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.04] active:scale-[0.98]">
            Enter the shop
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
