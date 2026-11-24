#!/usr/bin/env node
/**
 * Replaces data/sneakers.json with a catalogue imported from
 * sneakersdon.store (a WooCommerce shop exposing the public Store API).
 *
 *   node scripts/import-sneakersdon.mjs              full import
 *   node scripts/import-sneakersdon.mjs --limit 3    smoke test (writes data/sneakers.test.json)
 *   node scripts/import-sneakersdon.mjs --no-static  skip brand logos / banner assets
 *
 * What it does:
 *   1. Fetches every product from /wp-json/wc/store/v1/products
 *   2. price = their price − 300 GHS, no originalPrice (no fake struck prices)
 *   3. Downloads every product image to Vercel Blob (next/image only renders
 *      allowlisted hosts, so their server must never be hotlinked) plus the
 *      brand logos and combo banner into public/
 *   4. Writes data/sneakers.json — then run `npm run db:seed -- --wipe`
 *
 * Requires Vercel Blob credentials in .env.local — imported images must live
 * on an allowlisted host, because next/image throws for anything else at
 * render time and a bad URL would take the storefront down.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      // `vercel env pull` writes quoted values; strip the quotes so JWTs and
      // tokens arrive intact.
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[match[1]] = value;
    }
  }
}
loadEnv();

const SOURCE = "https://sneakersdon.store";
const API = `${SOURCE}/wp-json/wc/store/v1/products`;
const PRICE_OFFSET = 300; // their price minus this becomes our price
const SIZE_STOCK = 10; // placeholder per size — the owner edits real stock in admin
const MAX_TAGS = 6;
const IMAGE_CONCURRENCY = 6;

const argv = process.argv.slice(2);
const limitIdx = argv.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(argv[limitIdx + 1]) : null;
const SKIP_STATIC = argv.includes("--no-static");
const OUT_FILE = LIMIT > 0 ? "data/sneakers.test.json" : "data/sneakers.json";

if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
  console.error(
    "✗ No Vercel Blob credentials in .env.local (BLOB_READ_WRITE_TOKEN).\n" +
      "  Imported images must live on an allowlisted host or next/image will\n" +
      "  throw at render time and take the storefront down."
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, tries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { "user-agent": "SneakerVault-Catalogue-Import/1.0" },
      });
      // 4xx (except 429) will not fix themselves — fail fast.
      if (!res.ok && res.status !== 429 && res.status < 500) {
        throw Object.assign(new Error(`HTTP ${res.status} for ${url}`), { fatal: true });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (error) {
      lastError = error;
      if (error.fatal) throw error;
      if (attempt < tries) await sleep(500 * attempt);
    }
  }
  throw lastError;
}

// Their descriptions are rich HTML (<p>, <h3> titles, entities like &#8220;).
// The storefront renders description as plain text with whitespace-pre-line,
// so paragraphs become blank-line breaks and every tag goes away.
function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0?39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function stripHtml(html) {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n");
  const text = withBreaks.replace(/<[^>]+>/g, "");
  const lines = decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return lines.join("\n\n");
}

const COLOR_HEX = [
  ["multi", "#a855f7"],
  ["black", "#1f2937"],
  ["white", "#f9fafb"],
  ["cream", "#f5f0e1"],
  ["bone", "#e7e0d0"],
  ["sail", "#f7f3ea"],
  ["grey", "#9ca3af"],
  ["gray", "#9ca3af"],
  ["silver", "#c0c0c0"],
  ["gold", "#d4af37"],
  ["red", "#dc2626"],
  ["orange", "#f97316"],
  ["clementine", "#f97316"],
  ["yellow", "#eab308"],
  ["green", "#16a34a"],
  ["blue", "#2563eb"],
  ["navy", "#1e3a8a"],
  ["purple", "#7c3aed"],
  ["fuchsia", "#d946ef"],
  ["pink", "#ec4899"],
  ["brown", "#8b5a2b"],
  ["tan", "#d2b48c"],
  ["beige", "#ede4d3"],
  ["gum", "#d9b38c"],
];

// Their colour terms are descriptive strings ("Warm Brown / White"). The store
// has no real hex values, so the swatch takes whichever recognised colour word
// appears *first in the name* — the swatch is a shopping aid, the photos carry
// the truth. (Checking the list in order would turn "University Red / White"
// into a white swatch, because "white" is listed before "red".)
function colorHex(name) {
  const lower = name.toLowerCase();
  let best = null;
  for (const [word, hex] of COLOR_HEX) {
    const at = lower.indexOf(word);
    if (at === -1) continue;
    if (best === null || at < best.at) best = { at, hex };
  }
  return best?.hex ?? "#d1d5db";
}

async function pool(items, limit, worker) {
  const queue = items.map((item, index) => [index, item]);
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      await worker(entry[0], entry[1]);
    }
  });
  await Promise.all(runners);
}

// ---------- fetch catalogue ----------

console.log("→ Fetching catalogue from sneakersdon.store…");
const products = [];
for (let page = 1; page <= 20; page++) {
  const res = await fetchWithRetry(`${API}?per_page=100&page=${page}`);
  const batch = await res.json();
  if (!Array.isArray(batch) || batch.length === 0) break;
  products.push(...batch);
  if (batch.length < 100) break;
}
console.log(`✓ Fetched ${products.length} products`);

// ---------- download images to Vercel Blob ----------

const blobUrlBySource = new Map(); // source URL → blob URL (dedupes repeats)
const fatalFailures = []; // products whose hero image could not be saved
const cosmeticFailures = []; // missing gallery shots — logged, product still imports

async function downloadToBlob(sourceUrl, pathname) {
  if (blobUrlBySource.has(sourceUrl)) return blobUrlBySource.get(sourceUrl);

  const res = await fetchWithRetry(sourceUrl);
  const bytes = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type")?.split(";")[0] || "image/webp";

  // Deterministic pathnames (catalog/<slug>/<index>.<ext>) + allowOverwrite
  // make a re-import replace files in place instead of duplicating them.
  const blob = await put(pathname, bytes, { access: "public", contentType, allowOverwrite: true });
  blobUrlBySource.set(sourceUrl, blob.url);
  return blob.url;
}

function pickBrand(product) {
  const named = product.brands?.find((b) => b.name)?.name;
  if (named) return named;
  if (/air\s*jordan/i.test(product.name)) return "AIR JORDAN";
  return "Other";
}

function buildColors(product) {
  const terms = [];
  for (const attr of product.attributes ?? []) {
    if (attr.name === "color") {
      for (const term of attr.terms ?? []) if (term.name) terms.push(term.name);
    }
  }
  // image "" keeps the colour recorded on the order without hijacking the
  // gallery — clicking a swatch then leaves the photo where it was.
  return terms.slice(0, 4).map((name) => ({ name, hex: colorHex(name), image: "" }));
}

function buildSizes(product) {
  const attr = (product.attributes ?? []).find((a) => a.name === "size");
  const terms = attr?.terms ?? [];
  if (terms.length === 0) return [];
  return terms.map((term) => ({
    size: String(term.name).trim(),
    available: true,
    stock: SIZE_STOCK,
  }));
}

// ---------- transform ----------

console.log("→ Transforming + downloading images (this takes a few minutes)…");

const candidates = [];
const skippedZero = [];
for (const product of products) {
  const price = Number(product.prices?.price ?? 0) / 100;
  if (price <= 0) {
    skippedZero.push(product.name);
    continue; // ₵0 − ₵300 would be negative and unpayable anyway
  }
  if (LIMIT > 0 && candidates.length >= LIMIT) break;
  candidates.push(product);
}

const imported = [];
let imagesDone = 0;
const totalImages = candidates.reduce((sum, p) => sum + (p.images?.length ?? 0), 0);

await pool(candidates, IMAGE_CONCURRENCY, async (_, product) => {
  const slug = product.slug || String(product.id);
  const price = Number(product.prices?.price ?? 0) / 100;

  const urls = [];
  for (let i = 0; i < (product.images?.length ?? 0); i++) {
    const source = product.images[i].src;
    const ext = (source.match(/\.(webp|jpe?g|png|avif)(?:\?|$)/i)?.[1] || "jpg")
      .toLowerCase()
      .replace("jpeg", "jpg");
    try {
      urls.push(await downloadToBlob(source, `catalog/${slug}/${i}.${ext}`));
    } catch (error) {
      // A missing gallery shot is cosmetic; a missing hero would break the card.
      if (urls.length === 0) {
        fatalFailures.push({ slug, error: String(error?.message ?? error) });
        return;
      }
      cosmeticFailures.push({ slug, error: `${source}: ${error?.message ?? error}` });
    } finally {
      imagesDone++;
      if (imagesDone % 50 === 0) console.log(`   …${imagesDone}/${totalImages} images`);
    }
  }
  if (urls.length === 0) {
    fatalFailures.push({ slug, error: "no images survived" });
    return;
  }

  let description = stripHtml(product.description ?? "");
  const name = decodeEntities(product.name).replace(/\s+/g, " ").trim();
  // Their descriptions open with an <h3> repeating the product title. Their
  // `name` field occasionally drops the closing quote the heading has, so the
  // comparison ignores quotes entirely.
  const unquote = (s) => s.replace(/[“”"'’]/g, "").toLowerCase();
  const firstLine = description.split("\n\n")[0] ?? "";
  if (firstLine && unquote(firstLine) === unquote(name)) {
    description = description.slice(firstLine.length).replace(/^\n+/, "");
  }

  imported.push({
    id: slug,
    name,
    brand: pickBrand(product),
    description,
    price: Math.round((price - PRICE_OFFSET) * 100) / 100,
    rating: 0,
    reviewCount: 0,
    heroImage: urls[0],
    images: urls,
    colors: buildColors(product),
    sizes: buildSizes(product),
    tags: (product.tags ?? []).map((t) => t.name).filter(Boolean).slice(0, MAX_TAGS),
  });
});

imported.sort((a, b) => a.name.localeCompare(b.name));

if (cosmeticFailures.length > 0) {
  console.warn(`⚠ ${cosmeticFailures.length} gallery image(s) failed (products still imported):`);
  for (const failure of cosmeticFailures.slice(0, 10)) {
    console.warn(`   ${failure.slug}: ${failure.error}`);
  }
}

if (fatalFailures.length > 0) {
  console.error(`\n✗ ${fatalFailures.length} product(s) could not get their hero image:`);
  for (const failure of fatalFailures.slice(0, 20)) {
    console.error(`   ${failure.slug}: ${failure.error}`);
  }
  console.error("  Fix your connection and re-run — nothing was written.");
  process.exit(1);
}

// ---------- static assets: brand logos + combo banner ----------

const STATIC_ASSETS = [
  { url: `${SOURCE}/wp-content/uploads/2025/06/Timberland-Logo-Banner.png`, out: "public/brands/timberland.png" },
  { url: `${SOURCE}/wp-content/uploads/2025/06/Nike-Logo-Banner.png`, out: "public/brands/nike.png" },
  { url: `${SOURCE}/wp-content/uploads/2025/06/Dior-Logo-Banner.png`, out: "public/brands/dior.png" },
  { url: `${SOURCE}/wp-content/uploads/2015/01/Adidas-Logo-banner.png`, out: "public/brands/adidas.png" },
  { url: `${SOURCE}/wp-content/uploads/2015/01/New-Balance-Logo-banner.png`, out: "public/brands/new-balance.png" },
  { url: `${SOURCE}/wp-content/uploads/2025/06/sneaker-deal-product.png`, out: "public/deals/combo-banner.png" },
];

if (!SKIP_STATIC) {
  console.log("→ Downloading brand logos + combo banner into public/…");
  for (const asset of STATIC_ASSETS) {
    try {
      const res = await fetchWithRetry(asset.url);
      const bytes = Buffer.from(await res.arrayBuffer());
      const target = path.join(root, asset.out);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    } catch (error) {
      console.error(`   ✗ ${asset.out}: ${error?.message ?? error}`);
      process.exit(1);
    }
  }
  console.log(`✓ ${STATIC_ASSETS.length} static assets saved`);
}

// ---------- write JSON ----------

if (imported.length === 0) {
  console.error("✗ Nothing imported — aborting.");
  process.exit(1);
}

writeFileSync(path.join(root, OUT_FILE), JSON.stringify(imported, null, 2) + "\n");

const prices = imported.map((p) => p.price);
const sizesCount = imported.filter((p) => p.sizes.length > 0).length;
const brands = [...new Set(imported.map((p) => p.brand))].sort();

console.log(`\n✓ Wrote ${OUT_FILE}`);
console.log(`   products: ${imported.length} (skipped ₵0: ${skippedZero.join(", ") || "none"})`);
console.log(`   price: ₵${Math.min(...prices).toFixed(2)} – ₵${Math.max(...prices).toFixed(2)} (their price − ₵${PRICE_OFFSET})`);
console.log(`   images on Blob: ${blobUrlBySource.size}`);
console.log(`   sizes imported: ${sizesCount}/${imported.length} (stock ${SIZE_STOCK} per size — edit in admin)`);
console.log(`   brands: ${brands.join(", ")}`);
if (LIMIT > 0) {
  console.log("\nSmoke test only — apply with: npm run db:seed -- --wipe (after renaming the file)");
} else {
  console.log("\nNext: npm run db:seed -- --wipe");
}
