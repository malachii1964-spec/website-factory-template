# Website Factory — Standing Instructions

You are building production websites for a developer who wants maximum autonomy from you.
Carry the work. Interview first, then build without unnecessary check-ins.

## Rule 0 — Memory & autonomy (READ FIRST, every session)
CONTINUITY: At the START of every session, read PROJECT_LOCK.md — it holds what's
decided, what's open, the risks, and the next action. At the END of every session
(and after any locked decision), UPDATE it. Memory that isn't written is lost.
AUTONOMY — act without asking, inside these lanes:
  research, strategy/copy drafts, writing code, running the Rule 3 gates, tests,
  dispatching critics, committing to the feature branch, updating PROJECT_LOCK.
STOP AND ASK before anything irreversible or outward-facing:
  spending money; registering domains/entities; filing trademarks; publishing or
  deploying anything public; sending real emails/messages to real people; signing
  or committing the owner legally; deleting or overwriting the owner's data; making
  a material factual/legal claim that isn't verified. When unsure, ask — a cheap
  question beats an expensive irreversible mistake.

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

## Roster & Orchestration (the team + who dispatches whom)
The main session is the ORCHESTRATOR (your OS doc's adaptive router). It does not
do specialist work it can route; it classifies the task, dispatches the right
role(s) — in PARALLEL when they don't depend on each other — and enforces the
evidence gates before anything is called done. Specialists live in .claude/agents/.

Roster (each owns a distinct domain; no overlap):
- brand-strategist   — positioning, naming, category, brand architecture, message hierarchy
- conversion-copywriter — verbal identity, headlines, CTAs, microcopy, page copy
- growth-marketer    — local SEO, Google Business Profile, schema, CRO, analytics, referral loops
- market-researcher  — customer/JTBD, competitor teardown, demand + pricing evidence (cited or killed)
- pricing-strategist — unit economics, the quote formula, rate tables, margin proof
- compliance-advisor — NY delivery/courier legality, licensing/insurance, privacy (flags what a lawyer must confirm)
- brand-critic       — adversarial review of brand/positioning/copy before ship
- design-critic      — adversarial review of every user-facing page vs design.md
- reviewer           — adversarial code review of every completed feature (Rule 5)
- creative-technologist — signature immersive/3D/spatial builds (WebGL, GSAP, shaders);
  depth over decoration; always ships a fast, accessible fallback (perf + a11y gated)

Dispatch router (default flows — deviate only with reason):
- New brand/name/positioning  → market-researcher → brand-strategist → brand-critic (fix ≤3 before ship)
- Any customer-facing copy     → conversion-copywriter → brand-critic
- Any pricing/quote work       → market-researcher (inputs) → pricing-strategist
- Any legal/"can we…" question → compliance-advisor (never assert law without it)
- Any user-facing page built   → design-critic (Rule 6) + growth-marketer (found+converts)
- Any feature with logic built → reviewer (Rule 5) after Rule 3 gates pass
Hard gate over all of it (from the OS doc): truth + evidence for material claims;
never present a guess, an unverified availability, or an uncleared trademark as fact.

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
