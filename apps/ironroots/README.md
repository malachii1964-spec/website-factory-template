# Lake Erie IronRoots

A year-round vegetable farm storefront — hydroponic + field-grown produce,
cart + Stripe checkout, accounts (Better Auth), order history, and a weekly
Harvest Box CSA subscription.

Lives in this repo as an independent app (`apps/ironroots`) so it doesn't
touch the existing FutureDeskAI site at the repo root. Same stack: Next.js
16 (App Router, TypeScript strict), Tailwind v4, Stripe, Resend — plus
Postgres (Neon) + Drizzle + Better Auth for accounts/orders/CSA.

## Run it

```
pnpm install          # from the repo root — installs both workspace apps
cd apps/ironroots
pnpm dev               # http://localhost:3000
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

## Activating features

The site builds and runs with zero external services — shop, cart, and
Stripe Checkout (once `STRIPE_SECRET_KEY` is set) all work without a
database. Accounts, order history, and the CSA subscription need Postgres:

1. Copy `.env.example` to `.env.local` and fill in the values you have.
2. Set `DATABASE_URL` (a free Neon project works) and `BETTER_AUTH_SECRET`.
3. Run `pnpm db:push` to create the Better Auth + orders/CSA tables.
4. Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (webhook →
   `/api/stripe/webhook`, event `checkout.session.completed`) to accept
   real payments and record orders.
5. Set `RESEND_API_KEY` + a verified sending domain for order confirmation,
   CSA welcome, and contact-form emails.

Every route that needs a service it doesn't have configured degrades to a
clear "isn't connected yet" message instead of crashing — see
`src/lib/db.ts`, `src/app/api/checkout/route.ts`, and
`src/components/not-configured-notice.tsx`.
