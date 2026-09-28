# SneakerVault

A sneaker storefront with an admin panel, built on Next.js (App Router), React 19 and Tailwind CSS v4.

- **Storefront** — product grid with search/brand filter/sort, product detail with colour and size-scale selection (US/UK/EUR/CM), 3-step checkout.
- **Payments** — Paystack popup checkout, verified server-side before an order is marked paid.
- **Email** — customer receipt + owner alert via Resend.
- **Admin** — password login, product CRUD with image upload, orders dashboard with status management.

## Requirements

- Node.js 20+
- A Paystack account (test keys work)
- A Resend account
- A Neon Postgres database

## Setup

```bash
git clone git@github.com:jayminforson/sneakervault.git
cd sneakervault
npm install
cp .env.example .env.local
```

Fill in `.env.local` — see [Environment variables](#environment-variables).

```bash
npm run dev
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

All are documented inline in [`.env.example`](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | yes | Signs the admin session cookie |
| `PAYSTACK_SECRET_KEY` | yes | Initializes and verifies transactions |
| `RESEND_API_KEY` | yes | Sends receipt and owner emails |
| `FROM_EMAIL` | no | Sender address (must be verified in Resend) |
| `OWNER_EMAIL` | yes | Destination for new-order alerts |
| `DATABASE_URL` | yes | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob storage for uploaded images |

## Project layout

```
src/
  app/              Pages (App Router)
    admin/          Login, dashboard, edit, orders
    api/            Route handlers (sneakers, orders, payment, upload, auth, notifications)
  lib/              db, paystack, email, size-conversion, auth
  types/            Shared TypeScript declarations
data/
  sneakers.json     Seed data for the product catalogue
scripts/
```

## Deploy

The app targets Vercel. Because the filesystem is read-only there, all product and order data lives in Postgres and uploaded images go to Vercel Blob — nothing is written to disk at runtime.

1. Push to `main`, or import the repo in Vercel.
2. Add every variable from `.env.example` to the project's Environment Variables.
3. Create a Neon database (Vercel → Storage → Create → Neon) and set `DATABASE_URL`.
4. Create a Blob store (Vercel → Storage → Create → Blob) and set `BLOB_READ_WRITE_TOKEN`.
5. Seed the catalogue: `npm run db:seed`.
