#!/usr/bin/env node
/**
 * Creates the database schema and seeds the sneaker catalogue from
 * data/sneakers.json.
 *
 *   npm run db:seed            create tables + insert the catalogue if empty
 *   npm run db:seed -- --force   re-insert the catalogue (upserts by id)
 *   npm run db:seed -- --wipe    DELETE the whole catalogue first, then seed
 *
 * --wipe is what a full catalogue replacement (e.g. a re-import) needs: sizes
 * cascade from sneakers, and orders.sneaker_id is denormalised text with no
 * foreign key, so past orders keep their product names.
 *
 * Requires DATABASE_URL (see .env.example).
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

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

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!url) {
  console.error(
    "✗ DATABASE_URL is not set.\n" +
      "  1. Copy .env.example to .env.local\n" +
      "  2. Add your Neon connection string\n" +
      "  3. Re-run: npm run db:seed"
  );
  process.exit(1);
}

const sql = neon(url);
const force = process.argv.includes("--force");
const wipe = process.argv.includes("--wipe");

const SCHEMA_STATEMENTS = readFileSync(path.join(root, "scripts", "schema.sql"), "utf8")
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

console.log("→ Creating schema…");
for (const statement of SCHEMA_STATEMENTS) {
  await sql.query(statement, []);
}
console.log("✓ Schema ready");

const catalogue = JSON.parse(readFileSync(path.join(root, "data", "sneakers.json"), "utf8"));

if (wipe) {
  console.log("→ Wiping existing catalogue (sneaker_sizes cascade, orders untouched)…");
  await sql`DELETE FROM sneaker_sizes`;
  await sql`DELETE FROM sneakers`;
  console.log("✓ Catalogue cleared");
}

const [{ n }] = await sql`SELECT count(*)::int AS n FROM sneakers`;
if (n > 0 && !force && !wipe) {
  console.log(`✓ Catalogue already has ${n} sneaker(s) — skipping seed (use --force to upsert)`);
  process.exit(0);
}

console.log(`→ Seeding ${catalogue.length} sneaker(s)…`);
for (const sneaker of catalogue) {
  await sql`
    INSERT INTO sneakers (id, name, brand, description, price, original_price,
                          rating, review_count, hero_image, colors, tags, images)
    VALUES (${sneaker.id}, ${sneaker.name}, ${sneaker.brand}, ${sneaker.description ?? ""},
            ${sneaker.price}, ${sneaker.originalPrice ?? null},
            ${sneaker.rating ?? 4.5}, ${sneaker.reviewCount ?? 0}, ${sneaker.heroImage ?? ""},
            ${JSON.stringify(sneaker.colors ?? [])}::jsonb,
            ${JSON.stringify(sneaker.tags ?? [])}::jsonb,
            ${JSON.stringify(sneaker.images ?? [])}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      brand = EXCLUDED.brand,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      rating = EXCLUDED.rating,
      review_count = EXCLUDED.review_count,
      hero_image = EXCLUDED.hero_image,
      colors = EXCLUDED.colors,
      tags = EXCLUDED.tags,
      images = EXCLUDED.images,
      updated_at = now()`;

  await sql`DELETE FROM sneaker_sizes WHERE sneaker_id = ${sneaker.id}`;
  const sizes = sneaker.sizes ?? [];
  for (let i = 0; i < sizes.length; i++) {
    const entry = sizes[i];
    await sql`
      INSERT INTO sneaker_sizes (sneaker_id, size, available, stock, position)
      VALUES (${sneaker.id}, ${entry.size}, ${entry.available !== false},
              ${Math.max(0, Math.trunc(Number(entry.stock) || 0))}, ${i})`;
  }
}

console.log(`✓ Seeded ${catalogue.length} sneaker(s)`);
