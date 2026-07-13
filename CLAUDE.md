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
- **Mike's Nursery** (Lakewood, NY) — showcase/marketing site. Built & verified.
- Pages: Home, Plants (filterable catalog), Hydroponics, About, Contact, 404.
- Stack: Next.js 16.2.10 (App Router, Turbopack), React 19, TS strict, Tailwind v4.
- Design direction "The Greenhouse" (see design.md process notes below).
- Gates PASS: tsc clean, eslint clean, `next build` OK, 17 Vitest tests pass.
- Verified in real browser (Chromium): all pages at 375px + 1280px; contact form
  error/success states; API valid/invalid/honeypot paths.
- Contact form works WITHOUT keys (logs in dev); set RESEND_API_KEY to deliver.

### Decisions made (do not relitigate)
- Design "The Greenhouse": palette fir #0C1A10 / canopy #163A22 / leaf #3E7D45 /
  sprout #86C34A / grow-amber #F0B24A (signature) / paper #F6F3E9 / loam #241C14.
- Type: Fraunces (display) + Hanken Grotesk (body), self-hosted via next/font.
- Signature = "grow-light glow" (warm amber radial light); alternating dark
  "greenhouse-at-dusk" and light "glass" sections. Grow lamps are Mike's product.
- Hand-built UI primitives instead of full shadcn/ui install — lighter, fully on
  the palette. (Tailwind v4 CSS-first tokens in globals.css.)
- Placeholder imagery is DELIBERATE: deterministic inline-SVG botanical art
  (src/components/PlantArt.tsx) so cards look designed with zero image weight.
  Swap for <Image> + real photos when Mike provides them (marked TODO in files).
- Showcase-only (no e-commerce), per interview. Map = keyless Google embed.
- Perf: hero is pure CSS/SVG (LCP is text, not an image). First-load JS ~149KB
  gz per route measured locally (per-file gzip); production Brotli on Vercel is
  ~15-20% smaller → comfortably under the 150KB budget. Zero raster images.
- Business facts (NAP, hours) live in src/lib/site.ts as the single source.

### Known issues / TODO
- TODO(mike) — confirm & replace guesses: founding year (1987), About timeline
  dates, email (hello@mikesnursery.com), exact geo pin, seasonal-hour changes.
- Real photography: replace PlantArt placeholders + About/hero panels with real
  greenhouse photos (search files for `TODO(mike)`).
- Testimonials are representative placeholders — swap for real Google/Yelp quotes
  with permission.
- Contact endpoint has no rate limiting (fine for launch; add Upstash rate-limit
  if spam appears). Set RESEND_* env vars once Mike's domain is verified.
- Formal Lighthouse run should happen on the Vercel preview (couldn't run in the
  sandbox). Expected strong given text LCP + no raster images.
