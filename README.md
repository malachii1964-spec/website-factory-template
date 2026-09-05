# Lake Erie Cannabis

The grower's almanac for home cannabis cultivation: stage-by-stage grow
guides (germination → cure), free membership that unlocks the deep-dive
library, bookmarks, a 21+ age gate, and a legal notice. Built with Next.js 16
(App Router, TypeScript strict), Tailwind 4, MDX content, Better Auth, and
Drizzle ORM on Postgres.

## Run it locally — zero setup

```bash
npm install
npm run dev
```

That's it. No database to install, no env vars: in dev the site starts an
embedded Postgres (PGlite) sidecar automatically and creates its own tables.
Sign-ups, logins, and bookmarks all work out of the box; dev data lives in
`.pglite/` (gitignored — delete the folder to reset).

## Deploy to production (Vercel)

1. Create a free Postgres at [neon.tech](https://neon.tech) and copy the
   connection string.
2. In Vercel → Project → Settings → Environment Variables, set:
   - `DATABASE_URL` — the Neon connection string
   - `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `BETTER_AUTH_URL` — the site's public URL, e.g. `https://lakeeriecannabis.com`
3. Create the tables once: locally run
   `DATABASE_URL="<neon url>" npm run db:push`
4. Push to GitHub; Vercel builds and deploys.

Any standard Postgres URL works too (Supabase, RDS) — the driver is picked
automatically.

## Editing content

Guides are MDX files in `content/guides/`. Frontmatter fields:

```yaml
title, summary, stage (germination | seedling | vegetative | flowering |
harvest-cure | troubleshooting), week ("WK 03"), difficulty (beginner |
intermediate | advanced), readMinutes, membersOnly (true/false), updated,
order
```

Add a file → it appears in the library, filters, search, and stage counts
automatically. Set `membersOnly: true` to gate a guide behind (free) signup —
visitors see roughly the first quarter as a teaser.

## Scripts

| Command | Job |
|---|---|
| `npm run dev` | Dev server + auto-started embedded dev database |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the Drizzle schema to `DATABASE_URL` (prod setup) |

## How it's put together

- `src/app/` — routes: landing, `/guides` (+ `[slug]`), `/join`, `/login`,
  `/account`, `/legal`
- `src/lib/guides.ts` — MDX loader with Zod-validated frontmatter and the
  teaser cut for gated guides (gating is server-side; full content never
  reaches a signed-out browser)
- `src/lib/auth.ts` + `src/db/` — Better Auth on Drizzle; Neon HTTP driver
  in prod, node-postgres elsewhere
- `scripts/dev-db.mjs` + `src/instrumentation.ts` — the dev-only embedded
  Postgres sidecar (one process owns PGlite, every Next worker connects over
  the standard wire protocol on `127.0.0.1:5522`)
- `design.md`, `performance.md`, `templates/`, `design-library/` — the
  website-factory working docs this site was built under

## Compliance note

Educational content only. The site ships with a 21+ age-gate interstitial and
a jurisdiction disclaimer at `/legal` — cultivation law varies; keep both.
