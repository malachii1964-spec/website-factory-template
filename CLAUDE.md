# Website Factory — Standing Instructions

You are building production websites for a developer who wants maximum autonomy from you.
Carry the work. Interview first, then build without unnecessary check-ins.

## Rule 1 — Interview before building (MANDATORY for any new site/feature)
Before writing any code for a new website or major feature, ask ONLY the questions whose
answers change the build. Ask them all at once, numbered, with a recommended default for
each so a lazy answer of "use defaults" still works. Maximum 8 questions.
QUESTION 1 IS ALWAYS THE TEMPLATE MENU: present the numbered list from
templates/INDEX.md and ask "pick a number, or describe something custom."
If a template is picked, read its spec file — it pre-answers most questions;
ask ONLY its ASK items plus anything genuinely missing. If custom, ask:
1. What is this site/app, in one sentence, and who uses it?
2. The 3 things a user must be able to do (this defines scope — nothing else gets built)
3. Content ready or placeholder? (paste any real copy/branding)
4. Data to store? (none / simple / user accounts needed)
5. Look and feel: one reference site or adjective, or "designer's choice"
6. Which capabilities does this site need? (checklist: send emails / take payments /
   user accounts / file uploads / editable content (CMS) / analytics / AI features /
   scheduled jobs — each maps to a default service in Rule 2; name a specific
   provider to override any default)
7. Anything explicitly OUT of scope?
Then restate the plan in 5 bullets, state your assumptions, and proceed. Do not wait for
approval unless something is ambiguous enough to waste hours if wrong.

## Rule 2 — Stack defaults and service menu (use unless the interview says otherwise)
Core (every project):
- Next.js (latest stable — verify current version before scaffolding), App Router, TypeScript strict
- Tailwind CSS + shadcn/ui for components
- Deploy target: Vercel (alternates if named: Netlify, Cloudflare, Railway)
- No Redux, no microservices, no GraphQL, no extra frameworks. Boring and small wins.

Capability → default service (only install what the interview selected):
- Database:        Postgres on Neon + Drizzle ORM  (alt: Supabase Postgres)
- User accounts:   Better Auth                     (alt: Supabase Auth, Clerk)
- Transactional email: Resend + React Email        (alt: Postmark)
- Payments:        Stripe                          (alt: Polar, Lemon Squeezy)
- File uploads:    UploadThing                     (alt: Supabase Storage, S3)
- Editable content/CMS: Sanity                     (alt: MDX files in-repo for simple sites)
- Analytics:       Vercel Analytics                (alt: PostHog for product analytics)
- AI features:     Anthropic API via Vercel AI SDK
- Scheduled jobs:  Vercel Cron                     (alt: Inngest for complex workflows)
Note: if the project needs database + auth + file storage together, propose Supabase
for all three (one service beats three) and let the human confirm.
For every selected service: use the official SDK, check its current docs before wiring
it up, add required keys to .env.example with a comment linking where to get them, and
verify the integration works end-to-end (e.g. a real test email arrives in dev) before
the feature counts as done.

## Rule 3 — Validation gates (a feature is NOT done until ALL pass)
After every feature, in order:
1. `tsc --noEmit` passes — zero type errors
2. Lint passes
3. `next build` succeeds
4. Tests pass. Every feature with logic gets at least one test (Vitest).
   Write the test from the acceptance criteria BEFORE or alongside the code.
5. You have run the dev server and verified the feature works in the actual browser
   flow, including one failure case (bad input, empty state, network error)
Never report "done" or move to the next feature with a failing gate. If a gate fails,
fix it first. Do not comment out or skip tests to make them pass.

## Rule 4 — Workflow discipline
- One feature at a time. Small, separate commits per logical change with clear messages.
- Make minimal changes — do not refactor unrelated code.
- Never invent the contents of a file you haven't read. Read it first.
- If a library or API might have changed recently, check its current docs before using it.
- Secrets go in .env.local (gitignored), never in code. Validate all user input with Zod.
- When genuinely unsure between two approaches with real tradeoffs, present both briefly
  and let the human choose. Otherwise decide and note the decision below.

## Rule 5 — Adversarial review (after gates pass, before the next feature)
Dispatch the `reviewer` subagent on every completed feature. Address every critical
and high finding before moving on; log medium findings in Known Issues.
Note: the quality gates in Rule 3 are ALSO enforced by a Stop hook — if it blocks
you, fix the failures; do not try to work around it.

## Rule 6 — Design
design.md is law: Part 1 is the human's taste, Part 2 applies to every build.
Before any UI code: run its Process (subject → design plan → self-critique
against defaults → build to plan). Use design-library/ as raw material: offer
2-3 named style directions from styles.md when the human has no references;
draw palettes from palettes.md (adapted to subject, never blind); follow
immersive-3d.md's full contract if 3D is chosen. After building any
user-facing page: dispatch the `design-critic` subagent and address fixes
scoring 3 or below. Never ship a page nobody has looked at.

## Rule 6b — Performance
performance.md is law: budgets (LCP/CLS/INP, per-route JS, image/font limits)
and rules apply to every build. Verification there is part of "done" for every
user-facing page. Beautiful-but-slow fails the whole mission.

## Rule 7 — Improve proactively
At the end of every working session:
1. Summarize what was built and what state it's in
2. Suggest the 3 highest-value improvements (performance, UX, security, polish) ranked
   by impact — but do NOT build them until approved
3. Update the Project Log below

## Project Log (keep current — this is the project's memory)
### Current state
- FutureDeskAI rebuilt on owned stack (off Manus). Next.js 16 App Router, TS
  strict, Tailwind v4, IBM Plex Sans/Mono via next/font. Live pages: Home,
  /products (30-item catalog + category filter), /products/[slug] (all 30,
  SSG), /about, /local-business, /membership, /legal/{terms,privacy}, 404,
  /checkout/{success,cancel}, /api/checkout. All gates green (tsc, eslint,
  next build, vitest). Pushed to branch claude/passive-income-analysis-vsbigm.
- Design: "Command Center" — premium light default + dark mode (user loves the
  black ground), electric-violet accent from the FD logo, instrument-readout
  signature. Owner = Malachi.
- Mission (per owner): positioning as an "AI learning center for every level";
  50% of every sale pledged to St. Jude — surface prominently & honestly.
### Decisions made (do not relitigate)
- Full Next.js rebuild (not de-Manus in place). Dark is the DEFAULT theme.
- Single source of truth for pricing (src/lib/pricing.ts) derives Stripe
  amounts from catalog price — fixes the old display≠charge bug.
- No money-back guarantee (owner's choice). Dan Martell = strategy lens only
  (value ladder, buy-back-time, free-first); NO name/face/quotes on site.
- Real sample previews pulled from source files (flagship + top sellers first).
- St. Jude: state the 50% pledge in brand's own words; do NOT use St. Jude
  logo/branding as an official partnership claim.
### Known issues / TODO
- Logo files needed as real uploads (currently CSS wordmark placeholder).
- DONE (Stage 2a/2b): HMAC signed secure downloads (/api/download), Stripe
  fulfillment webhook (/api/stripe/webhook) emailing signed link via Resend,
  free lead magnet (/free-toolkit + /api/subscribe). All no-op until keys set.
- ACTIVATION NEEDED: Resend key + verified sending domain; product files in a
  private bucket (DOWNLOAD_STORAGE_URL) named <slug>.pdf; DOWNLOAD_SECRET;
  Stripe webhook endpoint registered. See .env.example.
- Still Stage 2+: customer dashboard, order history, DB (optional — current
  delivery is DB-free via signed links).
- Deploy to Vercel needs owner's account + env keys.
- Product-content quality upgrade (the actual PDFs) still to do.
- Sample previews only cover ~3 products; roll out to the rest.
- Minor: Turbopack NFT over-trace warning from /api/download local-fs fallback
  (harmless; prod path is DOWNLOAD_STORAGE_URL bucket).

---

## Project: Lake Erie IronRoots (apps/ironroots)
A second, independent site in this repo — a year-round vegetable farm
storefront — kept in `apps/ironroots` as its own workspace package so it
never touches the FutureDeskAI app at the repo root (this repo doubles as
FutureDeskAI's live codebase, not a blank template, so a second unrelated
business gets its own app rather than overwriting it).

### Mission (per owner)
Grow organic vegetables vigorously (not just surviving), price them so a
low-income family can actually afford top-of-the-line produce, inspire
others in the county to grow their own food, and improve community health
as a whole. This isn't a tagline — it's built into site structure and real
features (below), researched against how real low-income-access CSAs and
mission-driven urban farms (Soul Fire Farm, EarthDance, Zenger Farm, Just
Roots Chicago, Raleigh City Farm) actually operationalize this.

### Current state
- Built via the ecommerce template (+ accounts, since a CSA needs them):
  full storefront, cart (localStorage), Stripe Checkout, Better Auth
  accounts, Drizzle/Neon schema for orders + CSA subscriptions, Resend
  emails, weekly Harvest Box CSA (recurring Stripe subscription).
- Pages: /, /shop (+ category filter), /shop/[slug], /cart,
  /checkout/{success,cancel}, /csa, /community, /growing-guides, /account
  (sign in/up), /account/orders, /account/subscription, /about, /contact,
  /legal/{terms,privacy}, 404.
- Catalog: 23 items in code (src/lib/products.ts) — leafy greens, roots &
  alliums, tomatoes & peppers, herbs, 2 Harvest Box sizes, and a new
  Seedlings & Starts category (4 items incl. a Beginner Garden Starter Kit)
  — each with real in-season months (hydroponic/greenhouse crops run all
  12; field/storage crops don't) driving the Harvest Wheel signature.
- Mission features, all real and functional, not just copy:
  - **Community Share**: a third, pay-what-you-can CSA tier (src/lib/
    pricing.ts CSA_PLANS, id csa-community-weekly) — honor-system slider
    $15-$45/week, no income verification. Client sends a pledge amount;
    /api/csa/checkout clamps it server-side via clampToPayWhatYouCan() so
    a tampered client request can't escape the range.
  - **Community Harvest Fund**: optional round-up donation at checkout
    (/cart, preset $5/$10/$25 via DONATION_PRESETS_CENTS) added as an
    extra Stripe line item; webhook passes it through to the order
    confirmation email as a thank-you line.
  - **Learn to Grow** (/growing-guides): free, genuinely useful beginner
    organic-growing content (seed starting, container gardening for no-yard
    households, composting, why organic, Lake Erie shoreline season notes)
    — no purchase required, not gated.
  - **Making It Affordable** (/community): explains the Community Share +
    Harvest Fund, and is deliberately honest that SNAP/EBT can't run
    through online Stripe checkout (it needs an in-person USDA/FNS
    retailer authorization) — states that's a TODO, doesn't fake it.
  - Home page has a dedicated "Why this farm exists" mission section;
    About page has a "The mission" section — both link through to
    /community and /growing-guides instead of just asserting values.
- Design: "Harvest Wheel" system — Lake Erie teal + harvest amber + soil/leaf
  accents, Fraunces (display) + Public Sans (body), light "greenhouse
  morning" default with a dark toggle. Signature: a 12-month Harvest Wheel
  that encodes the year-round claim structurally (home, product pages,
  about, CSA page).
- All gates green: tsc, eslint, vitest (23 tests), next build. Verified in a
  real browser incl. failure cases (checkout with no Stripe key, sign-up
  with no DB configured, CSA pledge clamping) — all degrade to a clear
  message or clamp silently, no crash. Pay-what-you-can slider verified to
  actually drive React state (not just a static mockup) via Playwright.
- Everything is database/service-optional by design (matches the root app's
  pattern): shop + cart + Stripe checkout work with zero services; accounts/
  orders/CSA activate once DATABASE_URL is set (`pnpm db:push` to create
  tables), matching src/lib/db.ts, auth.ts, and the API routes' 503
  "not configured" fallbacks.
- No `.claude/agents/` reviewer or design-critic subagents exist in this
  repo checkout (README describes them but the files aren't present), so
  QA was a manual adversarial pass: full route smoke test, Playwright
  screenshots at 1280px and 375px, and the failure-case checks above.

### Decisions made (do not relitigate)
- Kept as a separate `apps/ironroots` workspace package rather than
  replacing the root app's content — the root app is FutureDeskAI's real,
  already-built storefront, not a blank template instance.
- Skipped fabricated testimonials/founder bio and fabricated impact stats
  (e.g. "X families fed") — no real numbers exist yet, so /community says
  so explicitly rather than inventing them. Same standard as FutureDeskAI's
  testimonials decision below.
- SNAP/EBT is presented honestly as in-person-only / not yet authorized,
  not as a working online payment option — Stripe cannot process EBT, and
  it requires USDA FNS retailer authorization the owner hasn't done yet.
- Cart is client-side (localStorage), not server/DB-backed — the catalog is
  small (23 items) and checkout doesn't require an account; accounts exist
  for order history + CSA management, not for shopping.
- No product photography exists — product cards use category icons +
  copy, not stock imagery or placeholder photos.

### Known issues / TODO
- ACTIVATION NEEDED (all no-op until set): STRIPE_SECRET_KEY +
  STRIPE_WEBHOOK_SECRET, DATABASE_URL (Neon) + BETTER_AUTH_SECRET,
  RESEND_API_KEY + verified domain. See apps/ironroots/.env.example.
- SNAP/EBT at the farm stand needs the owner to apply for USDA FNS retailer
  authorization and get a physical EBT terminal — /community already
  states this isn't live yet; nothing else to build until that's approved.
- Real product photography needed — current cards use icons only.
- No Lighthouse/production performance run yet (no deployed URL) — route
  JS bundles look reasonable in dev (no heavy client libs) but budgets
  from performance.md haven't been measured against a live build.
- Deploy needs the owner's Vercel account + the env keys above.

### Update: Stripe Customer Portal self-serve for CSA (closes prior TODO)
- /account/subscription now has a real "Pause / cancel" button per
  subscription (src/components/manage-subscription-button.tsx) instead of
  "contact us directly." It calls /api/csa/portal, which verifies the
  subscription belongs to the signed-in user (userId + stripeSubscriptionId
  match in the DB — a guessed Stripe id can't open someone else's billing),
  retrieves the Stripe customer from the subscription, and opens a Stripe
  Billing Portal session. Falls back to the old "contact us" copy when
  STRIPE_SECRET_KEY isn't set.
- ACTIVATION NEEDED (one-time, no env var): turn on the Customer Portal at
  https://dashboard.stripe.com/settings/billing/portal — the API call
  fails until that's enabled for the Stripe account.
- Gates re-verified green (tsc, eslint, vitest 23 tests, next build); the
  not-configured fallback was checked in a real browser (no DB configured
  here, so the page correctly shows the existing "isn't connected yet"
  notice rather than crashing).
