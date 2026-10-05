import type { MetadataRoute } from "next";
import { getSneakers } from "@/lib/db";

const BASE = "https://www.sneakervault.live";

const contentPages = [
  { path: "/about", priority: 0.7 },
  { path: "/contact", priority: 0.7 },
  { path: "/faqs", priority: 0.6 },
  { path: "/feedback", priority: 0.5 },
  { path: "/delivery-returns", priority: 0.6 },
  { path: "/terms", priority: 0.4 },
  { path: "/privacy", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    ...contentPages.map((page) => ({
      url: `${BASE}${page.path}`,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
  ];

  // Product pages live behind /sneaker?id=… so they are listed by id. A catalogue
  // query failure must never take the sitemap down with it.
  try {
    const sneakers = await getSneakers();
    for (const sneaker of sneakers) {
      pages.push({
        url: `${BASE}/sneaker?id=${encodeURIComponent(sneaker.id)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Sitemap could not read the catalogue:", error);
  }

  return pages;
}
