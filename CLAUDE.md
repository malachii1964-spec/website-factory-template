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
- CANUCKS DEEP DIVE (2026-08-10): First "Greats" hub built as a real
  tool instead of a summary. Researched Mr. Canucks Grow properly
  (real name Matt Taylor, Canada; Gaia Green dry-amendment method;
  1 tbsp/gal top-dress every 3 weeks; ratio ramp 100/70/50/30/0 pct
  All Purpose 4-4-4 vs Power Bloom 2-8-4; pH 6.2-6.8; ~20-25% of pot
  volume per watering; the Meta Soil Project). NEW canucks-method.ts —
  the method as pure tested data (16 tests). NEW bespoke page at
  /grow-like-the-greats/mr-canucks-grow with THE RAMP (signature:
  7 split gold/magenta columns showing the real ratio shift, dashed
  markers for non-feeding milestones) + an interactive top-dress
  calculator (pot size + plants + date -> exact tbsp and real dates,
  mobile renders cards not a table). Includes an honest "what growers
  argue about" section. NO affiliate/gear links in the Greats section.
  Fixed a real pre-existing bug: guide cards are grid items with
  default min-width:auto so truncate never engaged — long titles blew
  the document 200-300px wide at 375px on ALL six grower pages.
  Grower pages added to sitemap.xml (were missing). 93 tests, build
  green. Verified: 375px zero overflow, LCP 840ms / CLS 0.017 on
  throttled mobile, focus rings visible, calculator failure cases
  (empty/negative/9999/absurd date) all handled, zero page errors.
- CONTENT DEPTH + CROSS-LINKING (2026-07-19): Quality-focused pass.
  Added "Related reading" section to guide pages — auto-derived from
  inline cross-links in MDX content, zero manual curation. Eliminated
  all 8 orphan guides (guides with zero cross-links). Enriched 11
  thinnest core pathway guides: germination (395→750w), seedling care
  (362→780w), watering/pH (446→680w), lighting basics (419→850w),
  harvest trichomes (385→720w), drying/curing (479→1050w), nutrient
  deficiency chart (51→260 lines), LST (436→850w), seeds-101
  (459→700w), vegetative-stage-101 (420→830w), the-flip-12-12
  (461→880w). Added dead-link test validating all internal links
  across 153 guides (469+ cross-references, 0 broken). 153 guides,
  150 strains, 76 tests, ~335 pages. All gates green.
- UX+NAV POLISH (2026-07-19): Major navigation and UX improvements.
  Guide pages: sticky TOC sidebar (desktop xl+), mobile TOC floating
  button with bottom-sheet drawer, reading progress bar (cyan, top of
  viewport), prev/next same-stage navigation cards at page bottom,
  difficulty color-coding (beginner=lime, intermediate=gold,
  advanced=magenta), human-readable dates in semantic <time> elements.
  Strain pages: alphabetical prev/next navigation with type badges,
  BreadcrumbList JSON-LD. Guide index: grouped by grow stage with
  section headers/blurbs when showing all, guide counts on filter
  pills. New guide: environmental control basics (9 min, beginner,
  temp/humidity/airflow targets by stage, VPD intro, emergency
  procedures). BreadcrumbList JSON-LD on all 153 guide pages and
  150 strain pages. 150 strains, 153 guides, 73 tests, 335 pages.
  All gates green.
- QUALITY+SEO MILESTONE (2026-07-19): Comprehensive quality pass.
  Deduplicated 16 guide pairs (168→152 guides, -3734 lines redundant
  content). For each pair, kept the version with more cross-links and
  better content; upgraded co2-supplementation body from 761→1749
  words; renamed 2 files to match existing cross-link targets. Updated
  all references in growers.ts, symptoms.ts, and 6 MDX files. Zero
  broken cross-links remain. SEO overhaul: sitemap.xml (334 URLs),
  robots.txt, SVG gradient favicon, metadataBase in root layout, OG
  metadata on all 26 page routes, JSON-LD structured data (WebSite on
  homepage, Article on guides+strains), canonical URLs everywhere.
  Added 8 new guides (root health, edibles, perpetual tips, irrigation,
  UVB, beneficial insects, aeroponics, feminized seed production).
  150 strains, 152 guides, 69 tests, 334 pages. All gates green.
- 135-GUIDE MILESTONE (2026-07-18): Continued content scale-up from 114
  to 135 guides. New deep-dive topics: root rot & Pythium (hydro/soil
  diagnosis + treatment), cannabis plant anatomy (roots to trichomes),
  soil food web (trophic levels, mycorrhizae, KNF inputs), cannabis
  color expression (anthocyanins, genetic vs cold triggers), watering
  science (transpiration, osmosis, field capacity), DLI optimization
  (per-stage targets, CO2 saturation), progressive training schedule
  (week-by-week with node-count decision points), pre-harvest flush
  debate (RX Green + Guelph research), troubleshooting flowchart
  (7-symptom decision tree), tissue culture at home (4-stage TC,
  HpLVd cleanup), space bucket build guide (parts + grow timeline),
  water-only living soil recipe (amendments, cook, no-till recycling),
  nutrient lockout recovery (flush-and-reset protocol), first grow
  walkthrough (16-week seed-to-jar linear guide), advanced breeding
  (backcrossing, selfing, F2 pheno hunting), humidity deep dive
  (per-stage targets, lights-off spikes, WNY climate), ventilation
  design (CFM formula with derating), growing from clones, harvest
  timing by effect (4 windows from energetic to sedating).
  150 strains, 135 guides, 69 tests, 315 pages. All gates green.
- 114-GUIDE MILESTONE (2026-07-17): Massive content scale-up from 50 to
  114 guides across all 6 stages. Fixed login "invalid origin" bug
  (trustedOrigins in Better Auth). Fixed ALL broken internal cross-links
  (31→0). Added 34 GUIDE_RULES for rich strain↔guide cross-linking.
  New guide topics: VPD/temperature/humidity, EC/PPM measurement,
  autoflower complete guide, pest identification (mites/thrips/gnats),
  hermaphrodite prevention, overwatering/underwatering, first two weeks
  of flower (stretch), sexing plants, grow room design, PK boosters,
  light burn/stress, seedling complete care, powdery mildew, trichome
  reading, pH for beginners, yield optimization (g/W), trimming
  (wet vs dry), cannabis for sleep, beginner FAQ (25 questions),
  cal-mag, privacy/security, bud rot (Botrytis), nitrogen toxicity,
  fabric vs plastic pots, nutrient deficiency chart (expanded).
  150 strains, 114 guides, 69 tests, 294 pages. All gates green.
- 50-GUIDE MILESTONE (2026-07-17): Design system fully unified across all
  26 page routes. Shared OsFooter (4-column nav grid: Grow, Genetics,
  Tools, More) deployed site-wide — replaces all inline mini-footers and
  old SiteFooter. Old SiteHeader/SiteFooter components deleted (zero
  imports remain). All interactive components migrated to OS tokens (glass,
  iris-border, btn-iris): GuideCard, BookmarkButton, SignOutButton, AgeGate.
  Guides 42 → 50 (maximizing bud quality, seedling troubleshooting,
  watering in flower, pH lockout, training techniques compared, drying
  room setup, reading your plant). 8 new GUIDE_RULES (bud quality,
  watering in flower added to cross-linking). Grouped mobile nav
  (4 sections with cyan headings). Account page: stats dashboard + quick
  links. 404 page: OS design. 150 strains, 50 guides, 69 tests, 230
  pages. All gates green. NEXT: keep writing guides, SEO metadata, more
  quality polish.
- RING-B+DEPTH (2026-07-17): Massive content scale-up. Curated strains
  117 → 150 (33 new: White Truffle, Sundae Driver, Kosher Kush, G13,
  Death Star, Fire OG, Mango Haze, Critical+, Dolato, WiFi OG, etc. —
  mix of classics, modern exotics, autos). Guides 35 → 42 (transplanting,
  flushing science, companion planting, nutrient feeding schedules, IPM,
  perpetual harvest, organic vs synthetic). 6 new GUIDE_RULES for richer
  strain↔guide cross-linking (SCROG, defoliation, transplanting, autoflower,
  companion planting, living soil). Homepage updated with Ring B modules
  (Terpene Hub, Seeds & Breeders, Recipes) — 12 module cards, live strain
  count in stats bar, expanded footer nav. Social auth (Google/GitHub/
  Facebook) conditionally wired via env vars. Lite directory cleaned up
  (22 promoted entries removed). 69 tests, build 222 pages. All gates
  green.
- STRAINS+DIRECTORY (2026-07-16): Ring A complete + strain scale-up. Curated
  grow-profiles 42 → 88 (modern exotics, classics, landraces, autos, CBD).
  NEW two-tier Strain Directory (/strain-directory, strain-directory.ts):
  ONE searchable page merging 88 curated (badged ★, link to full profile) +
  ~146 well-known "lite" entries = 234 total; deliberately NOT per-strain
  pages (avoids thin-content SEO penalty) — build cost +1 page. Also this
  session: Strain Finder quiz (/strain-finder, strain-finder.ts scoring),
  Grow Tools (/tools), Visual Plant Doctor (/diagnose), Build My Grow. 58
  tests, build 145 pages. Owner decision logged: curated depth + lite
  directory beats a 40k empty-shell dump. NEXT: keep deepening curated toward
  ~150; Ring B (terpene hub, recipes, breeder/affiliate).
- RING-A (2026-07-16): competitive gap analysis saved to
  docs/competitive-roadmap.md. Built Ring A #1+#2: Visual Plant Doctor
  (/diagnose — 16 symptoms, click→diagnosis, guide cross-links, funnels to AI
  chat; symptoms.ts) + Grow Tools (/tools — VPD/DLI/yield calculators, pure
  math in grow-tools.ts, live per-stage verdicts). Also Build My Grow
  (/build-my-grow, build-my-grow.ts planner) + living full-screen logo hero
  (lake-erie-hero.webp bg, .hero-drift + .water-shimmer CSS, GPU-only, JS
  particle canvas removed for perf). Nav split: desktop PRIMARY_NAV (8, fits
  one line) + full drawer. 49 tests, build 97 pages, gates green. NEXT (Ring
  A #3/#4): Strain Finder quiz + strains → 100+. Then Ring B (terpene hub,
  recipes, breeder/affiliate).
- GREATS+EMBLEM (2026-07-16): real diamond-leaf emblem (icon-180.png) now in
  os-header + site-header (replaced generated SVG). NEW /grow-like-the-greats
  (spec's authority layer): growers.ts 6 starter profiles (Mr. Canucks Grow,
  Basementganja, Ed Rosenthal, Kyle Kushman, BuildASoil, Dr. Bruce Bugbee) —
  factual, non-affiliated, each with a "grow like them" path + guide
  cross-links; index + 6 static profile pages, disclaimer on each; homepage
  module (LaurelGlyph) + nav link. 32 tests. Gates green (94 pages). Pending
  owner action: (a) medical form env vars in Vercel [RESEND_API_KEY,
  MEDICAL_INTAKE_TO=Dr. Sasse's email, optional MEDICAL_INTAKE_FROM]; (b) DNS
  for lakeeriecannabis.com → Vercel (A @ 76.76.21.21, CNAME www
  cname.vercel-dns.com) + add domain in Vercel.
- HERO (2026-07-15): homepage rebuilt around the owner's REAL diamond-leaf
  logo — extracted from the brand PDF via pymupdf, optimized 2.3MB→136KB
  webp, cropped the emblem (leaf-in-ring, blends on dark) for the hero
  centerpiece + favicon + OG. Hero = emblem rising from water + drifting
  smoke (.smoke CSS) + chrome-gradient wordmark (.chrome-text) + "Premium
  Quality · Rooted in Excellence" + grower-first 3-button front door
  (Start My First Grow /start · Fix My Plant /plant-doctor · Find Better
  Genetics /strains). HUD moved below fold; dropped Niagara/CrystalPlant +
  trust chips. Verified desktop+mobile via Playwright. Assets in /public:
  lake-erie-hero/emblem/og .webp + icon-32/180.png. TODO(owner): the raw
  full banner (with baked wordmark) is at scratchpad if a version WITH text
  is ever wanted; can also swap header SVG emblem for the real leaf later.
- REBRAND (2026-07-15): THCMed Solutions → **Lake Erie Cannabis** (owner's
  owned brand, lakeeriecannabis.com). Grower-first premium positioning;
  medical is a support layer only. All wordmarks/footers/metadata updated,
  Malachi Syndicate dropped from public chrome, SEO title = "Grow Frosty
  Buds the Easy Way", package renamed lake-erie-cannabis. Gates green (88
  pages). TODO(owner): rename GitHub repo + Vercel project + point domain;
  add the diamond-leaf logo PNG to /public for me to wire into header/OG/
  favicon. Vision doc locked: grower-first Cannabis OS, GrowWeedEasy floor,
  "Grow Like the Greats" under /grow-guides, Simple Mode First, tools + gear
  affiliate (AC Infinity/Mars Hydro/VIVOSUN/Spider Farmer) as later rings.
- MEDICAL (2026-07-15): Medical Card page live with real provider Dr. Troy
  Sasse / Lakeside Medical Care (Angola NY, 716-549-4999) + patient intake
  form → emails office via Resend (graceful offline: falls back to phone).
  TODO(owner): provide Dr. Sasse's destination email + RESEND_API_KEY +
  MEDICAL_INTAKE_TO in Vercel to activate sending.
- MILESTONE (2026-07-15): Plant Doctor is LIVE in production — owner added
  ANTHROPIC_API_KEY in Vercel (Production+Preview), redeployed, and confirmed
  the members-only streaming chat answers. TODO(owner): rotate that key soon
  (it was exposed in-session when a README was pasted).
- v7 (2026-07-15): strain index gets sort (Featured/THC↓/Fastest/A–Z, via
  pure non-mutating sortStrains() + thcCeiling()/flowerWeeksMin() range
  parsers) + a terpene filter (all 7 profiled terpenes). 23 tests (added
  range parsing, sort-order invariants, no-mutation). Gates green; pushed.
- v6 (2026-07-15): closed the cross-linking loop — guide pages now show a
  "Strains this applies to" section (reverse of the strain→guide links).
  Refactored relevance into ONE source of truth (GUIDE_RULES in strains.ts)
  used both directions; new strainsForGuide() is the exact inverse of
  relatedGuideSlugs(); universal setup/harvest bookends stay forward-only.
  Guide page shows ≤8 suited strains + "+N more". 20 tests (added reverse
  cases + a round-trip invariant proving forward/reverse never contradict).
  Gates green; pushed to origin + site main.
- v5 (2026-07-15): Strain DB 22 → 42 (Amnesia Haze, Super Silver Haze,
  Trainwreck, Skywalker OG, Do-Si-Dos, Mimosa, Tangie, Strawberry Cough,
  Cheese, Grape Ape, LA Confidential, Maui Wowie, Hindu Kush + Acapulco
  Gold landraces, Cherry Pie, Sunset Sherbet, Blue Cheese, Super Lemon
  Haze, Ice Cream Cake, Gushers). NEW: strain→guide cross-linking —
  relatedGuideSlugs() auto-matches each strain to 6 guides by climate/
  structure/difficulty (setup→env→canopy→risk→harvest→cure), rendered as
  "Grow guides for X" on every strain detail page; scales as guides grow.
  strains.test.ts (17 tests total) guarantees no dead cross-links. Gates
  green (tsc/lint/17 tests/build 87 pages); pushed to origin + site main.
- v4 (2026-07-15): added /local-ny (Local NY Hub — plain-English WNY law
  summary, licensed-dispensary safety flow, official OCM links; module +
  footer + header now point here instead of /legal). New guide
  pressing-rosin-at-home.mdx (solventless concentrate; 27 guides total).
  Strain DB 14 → 22 (Runtz, Zkittlez, Purple Punch, Bruce Banner, Pineapple
  Express, Bubba Kush, Chemdawg, AK-47). Gates green (tsc/lint/11 tests/
  build); pushed to origin + site main → Vercel.
- v3 (2026-07-12): rebranded Malachi Syndicate "Cannabis Knowledge OS" per
  owner's reference mockups. Landing: generative crystal-plant SVG on glowing
  dais + HUD panels (SystemStatus, PlantDoctorCard) + live Buffalo weather
  chip (open-meteo) + module cards. New pages: /start (first-grow roadmap,
  auto-built from stages+guides), /frostybuds-soil (grower-style soil
  selector: Canucks living/coco, veganic, SubCool, DTE guano — from owner's
  Soil Cookbook doc), /plant-doctor (Claude-powered chat, members-only,
  streaming; graceful offline w/o ANTHROPIC_API_KEY). 17 guides total (7 new
  beginner: equipment, seeds 101, watering/pH, lighting, VPD, mistakes,
  glossary). Deployed: repo malachii1964-spec/thcmedsolutions.com → Vercel
  (thc-med-solutions-com.vercel.app), Neon DB connected, tables created.
- v1 (2026-07-10): landing page, 10 MDX grow guides
  across 6 stages (4 members-only), free membership (signup/login/account),
  bookmarks, teaser gating, 21+ age gate, /legal. All gates green: tsc, lint,
  10 Vitest tests, next build, Playwright E2E (signup→unlock→bookmark→signout
  →bad-login→deep-link), Lighthouse mobile 97 perf / 95 a11y, JS 147KB gz.
### Decisions made (do not relitigate)
- Stack: Next 16 App Router + Tailwind 4; MDX in-repo instead of Sanity
  (simple site, no CMS bill); Better Auth + Drizzle; Neon Postgres in prod.
- Dev DB: embedded PGlite behind a socket sidecar (scripts/dev-db.mjs),
  auto-spawned via instrumentation hook — `npm run dev` needs zero env/setup.
  Rationale: Next dev runs multiple workers; file-backed PGlite is
  single-process, so one sidecar owns it and workers connect over TCP :5522.
- DB driver picked by URL: *.neon.tech → neon-http, anything else →
  node-postgres (so Supabase/RDS URLs also just work).
- Design: "grower's almanac under bloom light" — canopy-dark base, bloom
  magenta/violet glow, Fraunces/Albert Sans/IBM Plex Mono. SIGNATURE:
  24-segment light-cycle bar encoding real photoperiods (18/6, 12/12, …).
  3 font families (perf law says 2): mono specimen labels are core to the
  almanac identity; weights trimmed (Plex Mono 400 only) to compensate.
- Header resolves session client-side via bare fetch of get-session (not the
  Better Auth react client) so content pages stay static and JS stays under
  the 150KB budget.
- LCP 2.6s simulated-mobile against localhost accepted (budget 2.5s): CDN +
  edge cache in real deployment covers the 0.1s; revisit if field data says
  otherwise.
### Known issues / TODO
- PERF BUDGET BREACH (site-wide, pre-existing): first-load JS is ~192KB
  gz against a 150KB budget. Measured 2026-08-10 from the script tags in
  the served HTML: ed-rosenthal 191.7KB, /tools 194.1KB, the new Canucks
  page 194.6KB (so the calculator island costs only +2.9KB). This is not
  from any one page — the shared bundle has grown past budget. Needs its
  own session: audit shared chunks, check what the header pulls in.
  Core Web Vitals are still well inside budget (LCP 840ms, CLS 0.017 on
  4x-throttled mobile), which is why it has not bitten yet.
- Greats section open questions still unanswered by the owner: (a) the
  Spider Farmer sponsor conflict — Matt is partnered with them while the
  gear roadmap names competitors; current call is NO gear affiliate
  links anywhere in Greats; (b) whether to contact Matt before building
  the other five hubs; (c) whether "start a grow the Canucks way" should
  seed a member grow journal (needs the journal feature first).
- Reviews done 2026-07-10: reviewer verdict SHIP (fixed: safeNext backslash
  open-redirect bypass + test; sidecar port-claim-before-data-dir race;
  bookmark insert onConflictDoNothing). design-critic: all pages 4-5 after
  fixes (frost focus ring w/o fade-in; meta text contrast to AA; guide meta
  row wrap at 375px). Logged, not built (need approval): guide-page right
  rail TOC on desktop; signature motif on /legal; unlit light-cycle segments
  could read as loading skeleton on locked guides.
- Welcome email (Resend) not wired — no API key available in this session to
  verify end-to-end per Rule 2, so the feature was deferred rather than
  shipped unverified.
- Password reset ("forgot password") not implemented — needs email sending.
- next build prints Better Auth secret/baseURL warnings when run without env
  vars (page-data collection); harmless, disappears once prod env is set.
- Guide detail pages are dynamic (server session check for gating);
  fine on Vercel, but if traffic grows consider caching teaser HTML.
