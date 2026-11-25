// Landing-page promotions. Edit this file to change what the home page
// advertises — nothing else needs touching.
//
// Keep the copy honest: checkout charges the listed product price, so only
// promise a discount here once the prices in the admin reflect it.

export interface SeasonalSale {
  /** Short badge above the headline, e.g. "Black Friday". */
  label: string;
  headline: string;
  subline: string;
  cta: { label: string; href: string };
  /** ISO timestamps. Before `start` the banner counts down to the start; */
  /** between the two it counts down to the end; after `end` it is hidden. */
  start: string;
  end: string;
}

export const SEASONAL_SALE: SeasonalSale = {
  label: "Black Friday",
  headline: "Black Friday Week",
  subline: "Our biggest drop of the year. Fresh pairs added daily until Cyber Monday — once they're gone, they're gone.",
  cta: { label: "Shop the sale", href: "/shop?sort=price-low" },
  start: "2026-11-27T00:00:00Z",
  end: "2026-12-01T00:00:00Z",
};

export interface DealTile {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  /** Tailwind classes for the tile background + text colour. */
  theme: string;
}

export const DEAL_TILES: DealTile[] = [
  {
    eyebrow: "Bundle & save",
    title: "Combo Deals",
    body: "Pick two pairs, pay one delivery fee. One flat GH₵ 25 covers the whole order.",
    href: "/shop",
    theme: "bg-amber-300 text-gray-950",
  },
  {
    eyebrow: "Under GH₵ 500",
    title: "Budget Heat",
    body: "Clean everyday pairs that don't break the bank. Sorted lowest price first.",
    href: "/shop?sort=price-low",
    theme: "bg-gray-950 text-white",
  },
  {
    eyebrow: "Just landed",
    title: "New Arrivals",
    body: "The latest pairs to hit the vault, freshest first.",
    href: "/shop?sort=newest",
    theme: "bg-rose-500 text-white",
  },
];

export interface HeroShoeConfig {
  /** Product id — price and link come from the live catalogue. */
  id: string;
  /** Shown if the product can't be read from the database. */
  fallbackName: string;
  /** Background-free cutout in /public/hero (made with scripts/hero-cutout.py). */
  image: string;
  width: number;
  height: number;
  /** Soft colour that tints the hero backdrop while this pair is on stage. */
  accent: string;
}

// The pairs that rotate through the home page hero. To add one, cut it out
// with `python3 scripts/hero-cutout.py <photo> public/hero/<id>.webp 254`
// using a side-profile shot on a white background, then list it here.
export const HERO_SHOES: HeroShoeConfig[] = [
  { id: "air-jordan-4-retro-og-white-cement", fallbackName: "Air Jordan 4 Retro OG “White Cement”", image: "/hero/air-jordan-4-retro-og-white-cement.webp", width: 983, height: 583, accent: "#f87171" },
  { id: "asics-gel-kayano-14-pink-glo", fallbackName: "ASICS GEL-Kayano 14 “Pink Glo”", image: "/hero/asics-gel-kayano-14-pink-glo.webp", width: 1200, height: 561, accent: "#f472b6" },
  { id: "jordan-x-travis-scott-air-jordan-1-low-og-medium-olive", fallbackName: "Travis Scott × Air Jordan 1 Low OG “Medium Olive”", image: "/hero/jordan-x-travis-scott-air-jordan-1-low-og-medium-olive.webp", width: 982, height: 429, accent: "#a3a35c" },
  { id: "nike-air-max-95-og-neon-2025", fallbackName: "Nike Air Max 95 OG “Neon”", image: "/hero/nike-air-max-95-og-neon-2025.webp", width: 997, height: 519, accent: "#a3e635" },
  { id: "new-balance-1906r-castlerock-natural-indigo", fallbackName: "New Balance 1906R “Castlerock”", image: "/hero/new-balance-1906r-castlerock-natural-indigo.webp", width: 986, height: 433, accent: "#818cf8" },
  { id: "adidas-samba-og", fallbackName: "adidas Samba OG", image: "/hero/adidas-samba-og.webp", width: 986, height: 369, accent: "#4ade80" },
];

/** Brands featured as big tiles on the landing page. */
export const FEATURED_BRANDS = ["Nike", "AIR JORDAN", "New Balance", "Adidas"];

export const BRAND_LOGOS = [
  { brand: "Timberland", logo: "/brands/timberland.png" },
  { brand: "Nike", logo: "/brands/nike.png" },
  { brand: "Dior", logo: "/brands/dior.png" },
  { brand: "Adidas", logo: "/brands/adidas.png" },
  { brand: "New Balance", logo: "/brands/new-balance.png" },
];
