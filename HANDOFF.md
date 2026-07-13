# Mike's Nursery — the new website 🌿

A brand-new, top-of-the-line site for **Mike's Nursery & Hydroponics** (Lakewood, NY),
built to replace the old GoDaddy page. Fast, mobile-first, and built to get Mike
**found on Google**.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build` · `npm run start` · `npm run test` · `npm run typecheck` · `npm run lint`

## What's here

| Page | Path | What it does |
|------|------|--------------|
| Home | `/` | Cinematic hero, category grid, live "what's thriving this season," featured plants, hydroponics pitch, reviews, hours + map |
| Plants | `/plants` | Filterable catalog (26 sample items across 7 departments) |
| Hydroponics | `/hydroponics` | The grow-room story for serious indoor growers |
| About | `/about` | The family + three-greenhouse story |
| Visit | `/contact` | Contact form, hours, tap-to-call, directions, map |

Plus: designed 404, `sitemap.xml`, `robots.txt`, and `LocalBusiness` structured
data so Google shows Mike's hours, phone, and map in search.

## The two things to do before it's "Mike's" for real

### 1. Add real photos
Everything currently uses **designed placeholder art** (hand-drawn botanical SVGs —
they look intentional, not like broken images, and add zero load time). To swap in
real greenhouse photos, search the code for `TODO(mike)` — every spot is marked.
Drop photos in `public/` and replace `<PlantArt .../>` with Next.js `<Image .../>`.

### 2. Confirm the facts
All of Mike's business info lives in **one file**: `src/lib/site.ts` — name, phone,
address, hours, founding year, email. Update it there and it changes everywhere.
A few values are best-guesses from public listings (founding year, email, exact map
pin) and are flagged with `TODO(mike)`.

## Turning on the contact form email

The form already **works** — with no setup it validates input and logs messages on
the server. To have messages emailed to Mike:

1. Create a free account at [resend.com](https://resend.com) and verify Mike's domain.
2. Copy `.env.example` to `.env.local` and fill in `RESEND_API_KEY`, `CONTACT_TO`,
   `CONTACT_FROM`. (Links to get each key are in the file.)

## Deploying

Push to GitHub and import the repo at [vercel.com](https://vercel.com) — it detects
Next.js automatically. Add the env vars from `.env.example` in the Vercel dashboard,
then point `mikesnursery.com` at the Vercel project. Done.

---

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.
