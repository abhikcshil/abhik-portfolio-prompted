# Abhik C. Shil Portfolio

Cloudflare-native personal portfolio for Abhik C. Shil, built as an interactive solar-system interface. Domains are planets, projects are moons, and admin editing is designed to sit behind Cloudflare Access.

Target domain: `portfolio.acsstudios.co`

## Stack

- React + Vite + TypeScript
- Tailwind CSS plus custom global CSS
- Cloudflare Workers for API and app serving
- Cloudflare D1 using direct prepared statements
- Static TypeScript fallback data in `src/data/portfolio.ts`

This branch intentionally removes the old Render/PostgreSQL/Prisma/Next.js path.

## Local Development

Install dependencies:

```bash
npm install
```

Build the Vite app:

```bash
npm run build
```

Run the Worker locally with static assets and API routes:

```bash
npm run dev
```

Open `http://localhost:8787`.

For frontend-only UI iteration:

```bash
npm run dev:vite
```

## D1 Setup

Create the D1 database in your Cloudflare account:

```bash
npx wrangler d1 create portfolio-db
```

Copy the returned database ID into `wrangler.jsonc` under the `portfolio_db` binding.

Apply migrations locally:

```bash
npm run db:migrate:local
```

Seed local data:

```bash
npm run db:seed:local
```

Apply migrations remotely:

```bash
npm run db:migrate:remote
```

Seed remote data either with the SQL file:

```bash
npx wrangler d1 execute portfolio-db --remote --file ./migrations/0002_seed.sql
```

or by calling `POST /api/admin/seed` after deploying and protecting admin routes.

## API Routes

Public routes:

- `GET /api/portfolio`
- `GET /api/domains`
- `GET /api/projects`
- `GET /api/projects/:slug`

Admin routes:

- `GET /api/admin/portfolio`
- `POST /api/admin/domains`
- `PUT /api/admin/domains/:id`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `PUT /api/admin/placements`
- `POST /api/admin/seed`

Public helpers filter out draft, private, archived, and disabled content. Admin helpers can read all content.

## Cloudflare Access

Protect these paths with Cloudflare Access:

- `portfolio.acsstudios.co/admin*`
- `portfolio.acsstudios.co/api/admin*`

Leave these public:

- `portfolio.acsstudios.co/`
- `portfolio.acsstudios.co/project/*`
- `portfolio.acsstudios.co/api/portfolio`
- `portfolio.acsstudios.co/api/domains`
- `portfolio.acsstudios.co/api/projects*`

Create a self-hosted Access application in Cloudflare Zero Trust for `portfolio.acsstudios.co`, then add path policies for `/admin*` and `/api/admin*`. The Worker also checks for common Cloudflare Access headers outside local development, but Cloudflare Access is the primary security boundary.

## Deploy

Build and deploy:

```bash
npm run deploy
```

Attach `portfolio.acsstudios.co` to the Worker route in Cloudflare after deployment.

## ACS Studios

This portfolio is part of the ACS Studios ecosystem and should eventually be listed in the ACS Studios Pages Registry as:

- Portfolio
- `portfolio.acsstudios.co`
- Active or Building
