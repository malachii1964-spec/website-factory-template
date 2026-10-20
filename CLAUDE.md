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
5. Look and feel: one reference site or adjective, or "designer's choice";
   OR: what physical sensation should the page evoke in the first 3 seconds?
   If the site were a physical material, what is it made of?
6. Which capabilities does this site need? (checklist: send emails / take payments /
   user accounts / file uploads / editable content (CMS) / analytics / AI features /
   scheduled jobs — each maps to a default service in Rule 2; name a specific
   provider to override any default)
7. Anything explicitly OUT of scope?

**Interview rule: the owner answers creative questions. The system decides technical ones.**
Never ask the owner which framework, database, hosting, motion library, render tier,
email provider, or testing stack to use — infer and propose from the brief. Ask a
technical question only when the choice changes cost, ownership, or risk to the owner.
If inputs are missing: assume the most reasonable version, state the assumption in one
line, and build.

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
Before any "done" claim, run the `factory-gates` skill — it checks execution evidence,
scope, drift, claims, secrets, and reversibility, and produces a COMPLETE/PARTIAL/FAILED/
BLOCKED verdict. "Mostly done" is not a verdict.

## Rule 4 — Workflow discipline
- One feature at a time. Small, separate commits per logical change with clear messages.
- Make minimal changes — do not refactor unrelated code.
- Never invent the contents of a file you haven't read. Read it first.
- If a library or API might have changed recently, check its current docs before using it.
- Secrets go in .env.local (gitignored), never in code. Validate all user input with Zod.
- When genuinely unsure between two approaches with real tradeoffs, present both briefly
  and let the human choose. Otherwise decide and note the decision below.

### Task classification — name the type before starting
Every request is one of five types. Name it before doing anything.
- `ANSWER` — explain, summarize, or analyze (no file changes; produce text)
- `CREATE` — build something new (new file, new feature, new site)
- `DECIDE` — evaluate options and recommend; owner makes the call on ambiguous tradeoffs
- `FIX` — repair a broken behavior (run systematic-debugging; root cause before fix)
- `EXECUTE` — apply a confirmed decision (do the thing, run the gate, ship it)

Wrong classification wastes hours: treating a `FIX` as a `CREATE` skips root-cause
investigation; treating a `DECIDE` as an `EXECUTE` removes the owner from a call that
is theirs to make. When the type is genuinely unclear, name it as the closest type and
state the assumption in one line.

### Autonomy gating — run the `autonomy-gating` skill before any external side effect
Before any action that touches state outside the local repo (push, PR, email, DNS,
db:push, production deploy, merge), classify it by level and confirm authorization.
A3 and above require explicit approval for that specific action, that specific scope.
"Go ahead" on a plan authorizes the next step only, not every step in the plan.

### Subagent spawning gate — all four must be true before spawning a subagent
1. Single-agent success on this work class is genuinely poor (not just inconvenient)
2. The subtask shares minimal state with ongoing work
3. Coordination cost is demonstrably beaten by measured gains
4. A tighter prompt, better retrieval, or stronger verification CANNOT achieve the same
If any condition fails, do the work inline. Prefer shared structured state (project state
files, design DNA, validation reports) over agent-to-agent chat.

### Context rot — one place per rule, zero duplicates
Any rule, table, or protocol that appears in more than one file is a maintenance
liability: when one copy is edited the others drift. When you add a rule to one place,
remove it from the others and replace with a reference. The single authoritative location
for autonomy levels is `.claude/skills/autonomy-gating/SKILL.md`.

### Truth protocol — label every material claim in content and copy
Before shipping any page that contains factual claims, label each one:
- `VERIFIED` — directly supported by evidence you can cite
- `USER_PROVIDED` — stated by the owner; not independently verified
- `INFERENCE` — reasoned from evidence; explicitly labeled as such
- `UNKNOWN` — unresolved; must not ship without resolution or disclaimer
- `SIMULATED` — demo/placeholder data; must be visibly identified on the page
- `PROHIBITED` — not publishable under current evidence or authority

Never invent: testimonials, customer counts, ratings, prices, service areas,
partnerships, awards, health outcomes, compliance status, or performance results.
Repetition or confident phrasing does not turn inference into fact.
A page containing UNKNOWN or PROHIBITED claims is not done — fix or remove them.

## Rule 5 — Adversarial review (after gates pass, before the next feature)
Dispatch the `challenger` skill on every completed feature. The challenger must be a
different session or context from the one that built it — producer cannot grade their own
judgment criteria (returns `not_evaluated`, never `pass`). Address every critical and
high finding before moving on; log medium findings in Known Issues.
Note: the quality gates in Rule 3 are ALSO enforced by a Stop hook — if it blocks
you, fix the failures; do not try to work around it.

### Quality Floor — 7 dimensions (used by the reviewer and design-critic)
True Quality = the **lowest** score across all seven, NOT the average.
A 9/9/9/9/9/9/2 is a 2. Fix the floor, not the ceiling.

| # | Dimension | Core question |
|---|-----------|---------------|
| 1 | **Accuracy** | Is it factually and logically correct? No fabricated claims? |
| 2 | **Verification** | Were material claims checked or explicitly labeled (see Truth Protocol)? |
| 3 | **Completeness** | Does it fully satisfy the locked feature scope? |
| 4 | **Intent Alignment** | Does it solve the real problem, not a nearby easier one? |
| 5 | **Execution Readiness** | Can it be used immediately — no broken paths, missing states, or TODOs? |
| 6 | **Structure** | Is hierarchy clear? Most important thing first? |
| 7 | **Edge Cases** | Are risks, failure modes, empty states, and bad input handled? |

Scoring anchors: 9–10 survives hostile expert review unchanged · 7–8 usable with minor gaps stated ·
5–6 needs real work · 3–4 fundamentally misses the objective · 1–2 harmful if shipped.

The reviewer's report must call out the **Critical Vulnerability** (the one thing that
would most embarrass or harm the owner if discovered) and make a binary Ship / Don't Ship
call with the single condition that would flip it.

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
- SNEAK PEEK LIVE ON WWW (2026-10-20). Owner: "go live". main fast-
  forwarded 41f9242 -> bb93544 (only the 2 sneak-peek commits). Verified
  once the Vercel MCP reconnected: production dpl_CjQcaKvFQE8bbzUhzSWTcm
  u6GvnR READY on bb93544, live home 200 with "Watch the sneak peek",
  CDN-Cache-Control set, no X-Robots-Tag, 0 runtime errors in 6 h.
  ROLLBACK: promote dpl_6aXKJvxxprzWUJMhRHBrLRtomyju (41f9242).
  "DROP IT FOR REAL" (owner, same day): selling needs owner-only steps.
  Default plan given: Printful print-on-demand + Shopify under IronRoots
  LLC; first run = AOP hoodie, AOP tee, AOP bomber (Printful makes all
  three; snapshot costs ~$41-47 hoodie, ~$50 bomber, ~$23-25 tee + $5-8
  shipping, to confirm in their account). Cap only as an embroidered
  version (no Printful all-over cap found); cargos + crossbody later.
  BLOCKER: the renders are 1254px concept pictures, not print files;
  hoodie/bomber panels need ~4000px+ art (owner's handoff zip may have it).
  Owner creates accounts + bank; sends product links; I wire Buy buttons.
- DROP 01 SNEAK PEEK INTRO (2026-10-20, lake-erie-cannabis-paid
  claude/obsidian-splash 64282ce, now on main via bb93544 above). Owner: "take
  those specific products ... run smoke through the delivery splash page
  intro" -> mockup videos -> "go" + "advertise sneak peek". DropIntro
  (src/components/drop-intro.tsx, data in src/lib/drop-intro.ts + test):
  after the front door's Enter, on / only, once per browser (localStorage
  lec:drop01-intro; ?intro forces it): smoke curtain lifts, owner's black
  Obsidian lineup render (public/drop/drop01-obsidian-lineup.webp) comes
  through it, "Pick your smoke" Obsidian/Solar/Amethyst/Glacier swaps in
  the owner's 1254px cap renders and recolors all smoke with each
  colorway's catalog inks (smoke-field gained density/size options +
  setColors(colors, now)). Kicker "Sneak peek · Drop 01"; CTA "Get first
  access" (DropNotify) + See every piece + Enter the site; Skip/Esc;
  "Design preview · 21+" tag kept (concept renders). Home Drop section
  gets "Watch the sneak peek" (replays via window event); front-door link
  "See the Drop 01 sneak peek". Caps load only after 3.5 s or a pick.
  NOT USED: owner's light lineup image (misspells brand on tee/bag; says
  "Voted into production"). Verified: 171 tests, tsc, lint, build;
  browser 1868 + 390: first-visit flow, recolor, empty email refused, Esc,
  not shown again, replay works, never on /guides, no overflow/errors.
  STORE STILL NOT REAL: owner has not answered pieces / maker (Printful
  default) / payment (Shopify under IronRoots default; confirm cannabis-
  imagery policy with provider) / print files / prices / window.
  People's Grow voting ON HOLD by owner ("hold on the growers vote").
  SMOKE TONED DOWN (bb93544): owner "when u click on an image, the smoke
  rises too thick, make it go with the site". inks = 3 mist + 3 colorway
  (like the front door's MIST mix), no brightness filter, front haze
  opacity .6, back lifeScale 3 / density 1.5; picks after the first get
  .is-swap = 1.8 s wisp peaking at .4 instead of the opening curtain.
  Owner confirmed spelling must be right: caps + black lineup + intro
  copy all checked; light lineup image (misspelled) still unused.
- LIVE ON WWW (2026-10-20). Owner: "go live." main fast-forwarded
  3a5e00f -> 41f9242 (medical page, A B C D, People's Grow + story).
  Production dpl_6aXKJvxxprzWUJMhRHBrLRtomyju READY, aliased to www.
  Verified on the production deploy: /peoples-grow 200 with story +
  "Dates announced soon", /medical-card 200 with Fredonia office + his
  form, CDN-Cache-Control "public, max-age=300" on both, no X-Robots-Tag,
  /api/peoples-grow {"ready":false} private no-store (db:push NOT run,
  not approved), 0 runtime errors in first 15 min. ROLLBACK: promote
  dpl_3jSjaCp9Mkhw6MKcYRxiA7zU3RQk (3a5e00f). Entries below saying
  "NOT merged" are now merged.
- THE PEOPLE'S GROW (2026-10-20, lake-erie-cannabis-paid claude/obsidian-
  splash c80a91b, NOT merged). Owner: "a and b everything til you say you
  need the story". "Pick one of the greats" = the 6 GROWERS (not strains).
  (B) shareable announcement artifact https://claude.ai/artifact/1F6Z7AdU
  PtrExZ3ZAGwog6 (private; ballot is preview only; [DATE] placeholders;
  dashed story slot). (A) /peoples-grow on the site: CrystalHero, ballot
  (PeoplesGrowBallot -> /api/peoples-grow GET tally+myVote, POST vote),
  new table peoples_grow_vote (user_id PK, grower_slug; upsert = change
  vote), ACTS season map, story hidden until PEOPLES_GROW.story has text,
  dates null -> "Dates announced soon". Verified on local PGlite: signed-
  out 401, bad grower 400, 2 members vote, change keeps total at 2, API
  no-store, browser at 1868 + 390. 166 tests. STORY ADDED (41f9242 +
  artifact v2): "Still here", 18 paragraphs; one edit "This month marks
  three years" -> "In October 2026, I marked three years". ** OWNER:
  confirm recovery date + CRPA credential; give a donate link (story asks
  for support, none exists); send vote/Day 0 dates; approve `db:push` on prod (preview shares the prod
  DB, so until then voting on new.* says "Voting opens soon"). **
- A B C D BUILT ON REVIEW (2026-10-19, lake-erie-cannabis-paid
  claude/obsidian-splash 30f6e52, NOT merged; preview dpl_73tqvWVBTZC1y8J
  UrwZPXKPV9WCN READY on new.*). Owner: "go A B C D" after mockups.
  (A) src/lib/cdn-cache.ts: CDN-Cache-Control "public, max-age=300" on 24
  static routes + 107 open guides via next.config headers; members guides,
  /account /join /login /plant-doctor /api never (cdn-cache.test.ts);
  verified locally and on the preview deploy. docs/cloudflare-caching.md
  Rule 2 now "bypass cache if not". OWNER: add the Cloudflare rules after
  merge. (B) home = 6 chapters, ChapterStrip wraps SceneBand (views dish,
  crystal, rings, leaf, rocks, door), numbered rows; strip pause hidden.
  (C) strains: filter panel not sticky; .strain-bar (search, active chips
  from strain-filters.ts, count, Edit filters) sticky >=1024px; PageHero
  shade prop, strains uses "wide". (D) DropNotify on /drop hero ->
  /api/drop-waitlist -> Resend contacts.create (SDK 6.17 segments API;
  optional DROP_WAITLIST_SEGMENT_ID); no key = "not open yet"; NOT yet
  verified end to end (key only in Vercel; owner to test on new.*).
  159 tests, tsc, lint, build, browser checks 1868/768/390, 0 errors.
- DROP 01 PRODUCT MATRIX (2026-10-19, scratchpad only, not in any repo).
  Built from the owner's NEW Catalog Explorer (uploads/d8955982-..., its
  catalog-data JSON): 24 products, 113 palettes (107 P + 6 families
  F01-F06), 600 recipes (6 families x 10 motifs x 10 treatments, all fit
  all 24), product option_ids = 113 each. Workbook: Summary, Products
  (yellow cost/price inputs), Size Runs (PROPOSAL; explorer
  supplier_size_chart is null), Colorways, Design Families, Smoke
  Treatments, Design Recipes, Style-Color Matrix (17,112 rows) + SKU CSV
  (98,394). Columns mirror the explorer's concept export (concept_id,
  palette_id, recipe_id, supplier_variant_id, price_minor_units,
  sellable=FALSE). 34,408 formulas, 0 errors. Generator:
  scratchpad/drop-matrix/build_matrix.py <catalog-data.json> <outdir>.
- MEDICAL PAGE ON REVIEW (2026-10-19, lake-erie-cannabis-paid
  claude/obsidian-splash 450bb7d, NOT merged; preview dpl_6Re4mnxAS8DWjH
  zXVxkrzwJvqnhZ READY, on new.*). Owner: "go" after mockup. /medical-card
  rebuilt on the crystal scene WITH the tincture (public/splash/medical-
  scene.webp = scene.webp + bottle pixels from the original; phones reuse
  scene-narrow, 38 px differ); CrystalHero now shared by home + medical.
  Form = Dr. Sasse's own site fields; "How did you hear about us?" fixed to
  Lake Erie Cannabis server-side; referral number LEC-yymmdd-XXXX; optional
  MEDICAL_INTAKE_CC. Office: 276 W Main St, Fredonia NY 14063, (716)
  473-0345 (owner-confirmed; his site text still says 112). Home gets 4th
  door. 147 tests, tsc, lint, build, browser checks at 1868/768/390.
  ** OWNER: MEDICAL_INTAKE_TO (his form's inbox) unset, so the form shows
  "call the office"; no *_FROM set in Vercel, so mail goes from
  onboarding@resend.dev, which Resend only delivers to the account owner:
  verify lakeeriecannabis.com in Resend + set MEDICAL_INTAKE_FROM before
  his office can receive anything. Price line / "cheapest in NY" held until
  real prices are given (truth rule). Sasse to confirm same-day,
  telehealth, since 1997, walk-ins, discounts. **
- PAUSED 2026-10-19: owner is on the job search first ("we will come
  back to Lake Erie Cannabis"). Site is live and healthy. Parked, each
  needing an explicit go: (a) home page "chapters" redesign below the
  opening scene, owner wants the front-door look carried through and
  the lists to stop reading flat; mockup first per the owner rule;
  (b) Cloudflare caching fix: Vercel strips s-maxage, so prebuilt pages
  reach Cloudflare as max-age=0. Fix = CDN-Cache-Control on prebuilt
  routes (never on the 46 members guides) + corrected dashboard rules;
  docs/cloudflare-caching.md as written will NOT raise the 12.6% hit
  rate; (c) strains page filter box slides over the list on scroll;
  (d) the Strains title sits over the bright leaf (move to a calmer
  view if asked). Latest Cloudflare 30-day: 93,050 requests, 9,560
  visitors (+86%/+68%), 12.6% cached.
- LEAF LOWERED, LIVE (2026-10-19, main 3a5e00f, dpl_3jSjaCp9Mkhw6MKcYRx
  iA7zU3RQk). Owner: "the main leaf is too high" -> mockup shown -> "go,
  do both". Wide screens (min-width 861 + landscape): .scene-frame sized
  by --u = (100cqh - --scene-top - 30px)/790 so scene rows 10..800 (whole
  leaf + dish) fit; --scene-top = 24px front door, header+24px home; leaf
  at 62% across; edges masked into the dark. Phones: home scene starts
  under the menu bar again. Image files untouched. 56 placement checks
  at 8 sizes, 16 front-door + 17 band checks; live CSS confirmed on www.
- NEW LOOK IS LIVE ON WWW (2026-10-19). Owner: "go live". main fast-
  forwarded 35d5ebc -> 668c238 (everything on claude/obsidian-splash:
  splash, new look site-wide, flash fix, list pages, prebuilt guides,
  Drop 01, scene on every page). Production dpl_2UszFkc3GGynbD7bqApcy27W
  wmdj READY. Release gate: CONDITIONAL GO (open: independent design
  review; cold-cache LCP ~6 s slow 4G). Verified on www after deploy:
  /, /guides, open + members guide (members text absent signed-out,
  private no-store), /join, /shop, 404, robots.txt allows / and NO
  X-Robots-Tag on www; 0 runtime errors in the first hour. ROLLBACK:
  promote dpl_DrG3z8XKBj2uFuZ2edoGPuHwu1Qa (35d5ebc) or reset main to
  claude/backup-pre-splash-2026-10-18. new.* still points at the branch
  (same code now). Entries below that say "NOT merged" are now merged.
  ** OWNER: Cloudflare cache rules (docs/cloudflare-caching.md) now pay
  off; enable Vercel Analytics; remove STRIPE_* env vars. **
- FRONT DOOR LOOK ON EVERY PAGE (2026-10-19, lake-erie-cannabis-paid
  claude/obsidian-splash 668c238, NOT merged; deploy dpl_HXohUJSjEsYGnXV
  P2YUPm11eswy9 READY, live on new.*). Owner: "That landing page must
  completely define the look throughout the rest of the entire website"
  (inside pages had the palette/type but were flat black). Every inside
  page opens in SceneHero/SceneBand: the SAME scene.webp (cached by the
  front door) framed per section via VIEWS + viewStyle() in splash-
  scene.ts (door, leaf, dish, rings, rocks, crystal; .band-frame CSS
  places it with container units, no JS). Guides by stage (STAGE_VIEW in
  guides/[slug]); join/login use "door" (form on the dark rock, leaf
  right). Mist rises in each band, ripples where the dish shows; motion
  stops off screen (IntersectionObserver); ONE pause choice site-wide
  (localStorage lec:motion); reduced motion = still photo. Header open
  over the scene at the top, solid on scroll. btn-mint/btn-stone ARE the
  front door's Enter/I'm-not buttons (Michroma caps; .btn-sm). SceneTitle
  = silver line + glowing mint line. Footer rock strip tried and REMOVED
  (doubled the dish on short pages). /splash/* immutable 1 year; WebGL
  contexts released on leave. Verified: 145 tests, tsc, lint, build, 31
  routes x 375/768/1440 no overflow/errors, 16 front-door + 17 band
  checks, live fetch on new.*. LCP throttled phone: 0.33-0.38 s warm;
  ~6 s cold on slow 4G (same as the front door, 6.4 s) - over the 2.5 s
  budget for visitors whose cache dropped the scene; fix would need a
  preview image = owner's call (image rule). Gate verdict PARTIAL:
  independent design-critic/challenger not run. Drop 01 page untouched.
  TESTING GOTCHA: a 90-page sweep trips Better Auth's rate limit (429 on
  get-session) for later browser checks from the same IP; not a bug.
- FLASH FIXED + REFERENCE PAGES + FASTER GUIDES (2026-10-19, lake-erie-
  cannabis-paid claude/obsidian-splash a3c4a9c, NOT merged; deploy
  dpl_8yCraVQ71RtumW7A21g2sn5q1Lv3 READY). Owner: "do all 3, fix the
  flash first". (1) FLASH: root layout prints .splash-cover (z-49, same
  ground as the splash) in the HTML; AGE_CHECK_SCRIPT in <head> sets
  html[data-age-ok] from the cookie before paint so returning visitors
  never see it; Enter sets it too; <noscript> hides it; CSS steps it
  aside after 8 s if app JS never loads. src/lib/age-gate.ts holds the
  cookie name + script (tests). <html suppressHydrationWarning>.
  Measured slow 4G + 4x CPU, 390px: page frames before the splash
  ~1.4 s -> none; returning visitors paint immediately. (2) Recipes,
  Seeds, Greats index, Local NY, Medical Card, Soil Lab rebuilt as
  lists/.fact-row/.rules (no card grids, no per-item rainbow). Found and
  fixed selected states my class codemod had flattened (Diagnose symptom,
  Strain Finder top match, Soil Lab style, directory filter). callName()
  shared in growers.ts. (3) /guides static (GuideBrowser filters in the
  browser, URL is the state) + 107 open guides prerendered (s-maxage);
  46 members guides stay private/no-store and none of their text is in
  signed-out HTML. BookmarkButton resolves its own session; toggling no
  longer revalidates the guide page. docs/cloudflare-caching.md (prod
  repo) = the dashboard half, OWNER ACTION, safe to add before merge.
  142 tests, tsc, lint, build, 16 front-door checks, 8 guide-filter
  checks. NOTE: the shop bar is baked into static pages at build time,
  so after the shop end date a redeploy/purge is needed to drop it.
- WHOLE SITE REDONE IN THE NEW LOOK (2026-10-19, lake-erie-cannabis-paid
  claude/obsidian-splash 32cfee8, NOT merged; deploy dpl_UsWxyBwek5iNYK8
  ptKrpoXREe8dY READY). Owner: "everything from the old site is going…
  redoing the entire face of the whole website" + "it can never look like
  AI made it". Defaults taken: crystal leaf = logo; name stays Lake Erie
  Cannabis; the one scene is the only imagery. Design plan "obsidian &
  crystal" is written at the top of globals.css (palette sampled from the
  scene: obsidian/basalt/slate/mist, ONE mint accent, amethyst rare,
  quartz warnings, moss for sativa; Michroma short display lines only,
  Albert Sans for all reading incl. long titles, Plex Mono for real data;
  Fraunces REMOVED, so still 3 families). Old token names are aliased to
  the new palette; retired classes (glass, iris-border, btn-iris,
  iris-text, aurora, starfield, god-rays) are neutralized in
  @layer components. Shared pieces: site-nav.ts (one nav map), Wordmark,
  PageHero (left-aligned, width-matched to body), GuideRow, .chip,
  .surface, .btn-mint/.btn-stone, .tabs, .field, strain specimen table.
  Home opens on the same crystal scene (useCrystalScene hook shared with
  the splash; wakes on SPLASH_CLOSED). Lists not card walls: guides,
  strains, strain directory, gear, related reading. Fixed along the way:
  phone overflow on Diagnose/Build My Grow, sticky filter panels covering
  phone screens, mobile TOC button sitting on the shop bar, "What to take
  from Mr.", inputs with no background. 132 tests, tsc, lint, build, 16
  splash/home flow checks, zero overflow on 29 routes at 375 and 768.
  NOT DONE: independent design-critic/challenger review (needs another
  session); reference pages (recipes, seeds, greats, local-ny, medical,
  soil) still use stone card grids; account page only checked in code.
- SPLASH REBUILT FROM OWNER'S "GANJA MULTIVERSE" MOCKUP (2026-10-19,
  lake-erie-cannabis-paid claude/obsidian-splash 254bf18, NOT merged;
  deploy dpl_BpVcmNqsA8Fojrbx5tNRGHTgP6mr READY). Owner: "make it look
  more like this, but remove the thc tincture, want smoke coming up from
  the slow moving ripples in the water". Tincture + baked mockup text/
  buttons erased with LaMa (big-lama.pt from github Sanster/models; torch
  from pypi, ~5.6GB; HF and download.pytorch.org are BLOCKED here). 0
  pixels changed outside the masks; lossless WebP public/splash/scene.webp
  (1672x941, 1.24MB) + scene-narrow.webp (column x=480..1270, 703KB, phones
  <=640px). leaf.webp removed. Words kept "Lake Erie Cannabis" (mockup's
  "The Ganja Multiverse" NOT used, ask owner), Michroma display face added
  (4th family, preload:false, splash only). Ripples = tiny WebGL pass over
  only the dish (src/lib/water-ripples.ts, POOL ellipse in splash-scene.ts)
  bending the photo's own reflections; mist-colored smoke rises off the
  water (smoke-field gained Origin.depth + lifeScale). Reduced motion = no
  ripple pass; no WebGL = still photo. Verified: 132 tests, tsc, lint,
  build, 15 browser flow checks, 5 screen sizes. Splash JS +1.9KB gz.
  STILL OPEN: old-homepage flash before the splash (0.6-1.4s on phones,
  same on www) - offered fix, owner has not said go.
- PROD AUDIT (2026-10-18, lake-erie-cannabis-paid main 35d5ebc, verified
  in code/build/Vercel): (1) 0 of 153 guide pages and not even /guides
  are prerendered in prod; the static/prerender work exists only in this
  factory copy, so every guide is rendered per request and Cloudflare
  cannot cache it. (2) No password reset, no email verification. (3) No
  rate limiting or bot check on auth, shop-order, medical-intake or
  plant-doctor APIs; Plant Doctor is members-only but signup is free, so
  turning on ANTHROPIC_API_KEY without a per-user cap is an open bill.
  Model id in code is "claude-sonnet-5" (check it before enabling).
  (4) No CI workflows, no error monitoring, no security headers of our
  own. (5) Preview deployments use the PRODUCTION DATABASE_URL, so
  sign-ups/orders on new.* land in the real member DB. (6) Schema changes
  go through db:push (no drizzle/ migrations dir). (7) STRIPE_* env vars
  still set in Vercel prod+preview though Stripe was removed; ANTHROPIC_
  API_KEY and MEDICAL_INTAKE_TO absent. Medical intake collects contact
  details only (name/email/phone).
- DROP 01 PAGE ON REVIEW BRANCH (2026-10-18, lake-erie-cannabis-paid
  claude/obsidian-splash f95fc16, NOT merged; serves on new.* once DNS
  exists). Owner said "go, defaults": /drop "The Smoke Collection" design
  preview, built to the section order the owner pointed at (hero, proof,
  lineup, colorways, how it works, questions, closing CTA). Data =
  owner's catalog explorer (24 styles x 113 palettes, src/data/
  drop-catalog.json); 52 concept renders matched to style+colorway by
  image comparison, taken from the 87-page PDF at 944px (lossless there)
  or the explorer's 768px JPEGs. All 52 proofread: brand name spelled
  right on every render (the owner's AI mockup misspelled it on 4 of 6
  pieces, which is why that image is not used). SIGNATURE: picking a
  colorway turns the page's smoke into that colorway's smoke inks
  (smoke-field.ts setColors). Truth rules held: renders labeled concept
  render; untried colorways show a color study + placement, never a
  recolored photo; no "voted", no "shop", counts computed from data.
  JSX GOTCHA (cost a debug loop): multi-line text right after a {value}
  that contains an HTML entity like &apos; loses its leading space in
  this compiler ("113colorways"). Use ’ or a template string instead.
  Hidden sr-only radios inside an overflow box need position:relative on
  the box or they stretch the page ~1300px below the footer.
  Verified on a production build: LCP 0.35s / 0.60s throttled mobile,
  CLS 0, hero 72-101KB, first-load JS 161.9KB vs /guides 159.8KB (lazy
  loading the browser saved only 2KB, so not kept). factory-gates verdict
  PARTIAL: independent design/challenger review not run (needs another
  session). OWNER: Cloudflare CNAME new -> 89db103d49793cba.vercel-dns-
  017.com (grey cloud) still missing as of this entry.
- OBSIDIAN SPLASH ON REVIEW SUBDOMAIN (2026-10-18, repo lake-erie-cannabis-
  paid, branch claude/obsidian-splash 066a102, NOT merged; www untouched,
  prod still dpl_DrG3z8 = main 35d5ebc). The 21+ box is replaced by a
  splash gate: crystal leaf above the lake, 2D-canvas smoke rising off the
  water, then "LAKE ERIE CANNABIS" + "I'm 21+ — Enter" / "I'm not" (same
  thcms_age_ok cookie). Files: splash-gate.tsx, smoke-field.ts (pure maths,
  tested). Owner chose A (photo leaf) over their own Three.js "Living
  Crystal" splash file (low-poly leaf, brought the bubbles back, Arial).
  OWNER RULE: the image must not change except the edit. The leaf is a
  lossless WebP crop (x=646 w=682, 0 differing pixels) of the PNG embedded
  in that splash file — cleaner than the catalog's lossy webp — served raw
  from /public/splash, NEVER through next/image (it re-encodes). ~1MB,
  accepted for that rule. Smoke sits behind the photo, not over it.
  new.lakeeriecannabis.com added in Vercel, bound to the branch. It is
  PUBLIC (ssoProtection = all_except_custom_domains), so: X-Robots-Tag
  noindex for that host only (next.config headers, host match), and Better
  Auth trusts it (auth-origins.ts) or every login there is "Invalid
  origin". Verified on dev: noindex only on new.*, sign-up 200 from new.*,
  403 from an untrusted origin. 110 tests, build green.
  ** OWNER ACTIONS: (a) Cloudflare DNS: CNAME new ->
  89db103d49793cba.vercel-dns-017.com, DNS only (grey cloud); (b) review
  on new.*, then explicit "go" to merge into main for www. **
  DNS FACTS: lakeeriecannabis.com nameservers are Cloudflare; www is
  proxied through Cloudflare (A = CF IPs), Vercel verifies via http-01.
  BACKUPS: claude/backup-pre-splash-2026-10-18 (= main 35d5ebc);
  claude/design-obsidian-splash holds every owner upload (catalog explorer,
  87-page clothing catalog PDF sha256 fba4cea6...d5f259, print catalog,
  merch brief, cinematic splash). This environment cannot push git TAGS
  (proxy 403) — back up with claude/* branches instead.
  PARKED: merch store brief (24 styles x 113 palettes). The 147MB
  Lake_Erie_Cannabis_Claude_Handoff.zip it depends on was never received,
  and it is blocked on the owner's clothing payment path (IronRoots LLC
  checkout vs cannabis-friendly processor; Stripe is out).
- FIXES PORTED TO PROD (2026-10-17, lake-erie-cannabis-paid main 35d5ebc):
  (1) two guides that were 500ing live (confirmed: trimming-wet-vs-dry
  returned 500) — "<50%" in MDX tables; reworded + test that fails on any
  bare "<digit" in a guide body. (2) Vercel Analytics + Speed Insights.
  (3) min-w-0 on 6 flex rows + strain-directory grid cards (was 405px at
  375); layout-guards.test.ts ported. All 9 key routes measured 375px
  wide; 103 tests; deploy READY; fixed guide verified 200 live.
  ** OWNER: enable Analytics + Speed Insights in the Vercel project
  (Analytics tab -> Enable) or no data is collected. ** Remaining
  dev-only features to port: grow journals, /drops, community.
- FREE MEMBERSHIP LIVE (2026-10-17): owner decision "keep it free, the
  entire thing". Reverted the $4/mo Stripe paywall in lake-erie-cannabis-
  paid (5d4207e) — the paid join page was also the ONLY signup path, so new
  visitors could not join without paying. Free join restored; any account
  unlocks every members-only guide (verified locally: signed-out sees
  teaser, free account sees full text) and live /join verified. Billing
  routes removed (404). `subscription` table kept in schema so db:push
  never drops paid-period records. Decision logged: no Stripe on the
  cannabis site (Stripe restricted-business list bars cannabis-related
  businesses). ** OWNER: cancel any active Stripe subscriptions + delete
  the webhook endpoint in the Stripe dashboard; STRIPE_* env vars in
  Vercel can be removed. **
- SHOP LIVE (2026-10-16): claude/htg-shop fast-forwarded into
  lake-erie-cannabis-paid main (24e059b); Vercel production deploy READY
  and aliased to lakeeriecannabis.com; /shop verified 200 with all 9
  products. SHOP_ORDER_TO + RESEND_API_KEY were already set in Vercel.
  Still open: 6 SKUs marked LOOKUP (shown only in the owner's order email).
  ** TRUNK WARNING: production = repo lake-erie-cannabis-paid (Vercel
  project of the same name). This factory branch holds a DIVERGED copy
  of the LEC app — grows, drops, community, analytics, MDX + min-w-0
  fixes exist here only; Stripe membership + Fast Buds codes exist there
  only (42/16/38 files only-dev/only-prod/both-edited). Port features
  into the production repo; do not develop LEC here. ANTHROPIC_API_KEY
  and MEDICAL_INTAKE_TO are NOT set on the production project. **
- COMMUNITY PHASE 1 (2026-09-23, branch claude/badass-website-5293xe):
  Social platform started. Owner interview locked: standalone brand
  (NAME STILL TBD), mounted at /community on this same app for now and
  moved to a subdomain with a shared login later; free at launch; 21+
  self-attestation; auto-publish + AI flagging + report button. North
  star is "Facebook + YouTube + X for cannabis"; Phase 1 is only the
  core loop: grow-update posts (caption, stage, strain, photo/video
  links) -> Latest + Following feeds -> strain passport, derived on read
  from posts and never stored. NEW tables social_profile, follow, post,
  post_media, post_report (separate from grow/grow_event_done). Handles
  are auto-generated on first visit and editable at /community/settings.
  3 distinct reports auto-hide a post (post_report PK is (post, reporter),
  so one user cannot report the same post twice). Verified against the
  real dev DB inside actual request scope: signup, gating, profile
  creation, post plus curated strain match (Wedding Cake ->
  wedding-cake), following feed, 3-report auto-hide, and the empty-post
  and signed-out failures. Also screenshotted at 375 and 1280. 150 tests.
  ** OWNER ACTIONS: (a) run `npm run db:push` in prod or /community
  shows "being switched on"; (b) optional SIGHTENGINE_API_USER/SECRET
  for automated photo screening (without them, moderation relies on
  reports only); (c) pick the platform name. **
  NOT BUILT YET: real file uploads (media is paste-a-link until an
  UploadThing key can be verified end to end), subdomain + Better Auth
  crossSubDomainCookies, likes/comments, DMs, video feed, admin review
  queue for hidden posts (right now they can only be restored in SQL).
  Environment notes: (1) the Playwright MCP server must launch with
  `--browser chromium --executable-path /opt/pw-browsers/chromium`
  (.mcp.json is fixed now, but that only takes effect after the session
  restarts). The workaround used this session was to drive the
  playwright-core already in the npx cache directly. (2) scripts/dev-db.mjs
  hand-maintains its own DDL, and grow/grow_event_done are STILL missing
  from it, so /grows cannot be exercised in local dev. (3) Killing
  `next dev` does not kill the dev-db sidecar, and a stale sidecar keeps
  port 5522 with the OLD DDL, so kill it by PID before restarting.
- HTG SHOP OPEN (2026-09-20, repo lake-erie-cannabis-paid, branch
  claude/htg-shop, NOT yet merged to main): /shop lists the opening 9
  products (cost $182.39 -> revenue $435.52 -> $253.13, 58%), chosen on
  profit-per-pound-shipped, not margin percent — there is no pickup, so
  every listing carries its own postage; anything sold by the cubic foot
  or gallon was excluded. Three real fixes found by looking at the page:
  (a) the banner had NEVER been visible — OsHeader is `fixed top-0 z-40`
  and the strip rendered in flow above it, so the header covered it on
  every route; it is now a bar fixed to the bottom of the viewport that
  renders an invisible inert clone of itself as its own spacer (a guessed
  height was 63px short at 375px and 8px at 1280px, burying the footer);
  (b) "Grand Opening SALE" removed — every price is HTG's published
  retail, so there is no discount and advertising one is a false price
  claim; it says "Now Open"; (c) /shop overflowed 66px at 375px because
  the UA stylesheet gives <fieldset> min-inline-size:min-content and
  `truncate` sets white-space:nowrap, making the longest product name a
  floor — min-w-0 fixes it. Also removed the local-pickup promise (does
  not exist) and documented SHOP_ORDER_TO/SHOP_ORDER_FROM in .env.example
  (the route already read them; a fresh deploy would have accepted an
  order and silently failed to deliver it). 100 tests, all gates green,
  verified in Chromium at 375 and 1280.
  ** OWNER ACTIONS: (a) merge claude/htg-shop — nothing is on main, so
  the shop is not live; (b) set SHOP_ORDER_TO in Vercel; (c) paste the 6
  real HTG SKUs still marked LOOKUP (EcoPlus Eco Air 8, Chlorine
  Snatcher, FloraFlex Matrix Pad, 10in carbon block, 10in sediment,
  AgroMax 250 GPH). **
  DEAD END, do not retry: OCR of HTG product-grid screenshots cannot
  produce quotable prices. Tesseract reads a 4-column grid left-to-right
  across all columns, so "Retail:" from column 1 pairs with "Your Price:"
  from column 3 — 23% of extracted pairs are provably impossible (96% off
  a mechanical timer) and the plausible-looking rest cannot be
  distinguished from the scrambled ones. This is also the cause of the
  earlier Flexitank-at-42-cents and Rockwool-elbow-at-95% readings. The
  working path is pasted page text (DOM order preserves name->price
  pairing) or a CSV export from the B2B account. Separately: tesseract
  under `xargs -P` in this container DEADLOCKS on OpenMP — 8 workers
  produced 16 files in 11 minutes then hung for 27 with zero children.
  `OMP_THREAD_LIMIT=1` fixes it: all 195 images OCR'd in 30 seconds.
- CACHE + COMMERCE (2026-09-05): Cloudflare showed 10.63% cache hit
  across 50k requests / 5.7k uniques in 30 days — ~45k origin hits that
  should be edge-served. Root cause is two-part: routes must BE static,
  and Cloudflare must be told to cache HTML (it never caches HTML by
  default on any plan). Code half done: /guides is now static (filtering
  moved client-side via useSyncExternalStore over server-rendered cards,
  all 153 links still in the static HTML), and 107 of 153 guide detail
  pages now prerender — the session is consulted ONLY for gated guides
  and BookmarkButton resolves its own state. All 46 members-only guides
  correctly stay request-time; verified no gated guide is prerendered
  and gating is intact (text at 30/60/90% through a gated guide absent
  from signed-out HTML). Dashboard half is NOT done — see
  docs/cloudflare-caching.md for the exact rules. ** OWNER ACTION. **
  Also: Vercel Analytics + Speed Insights added (site had none despite
  5.7k uniques). NEW /drops page + strip on /seeds for affiliate promo
  codes (copyable codes, optional expiry, rel="nofollow sponsored",
  disclosure). Fixed 2 guides with invalid MDX ("<50" parses as a JSX
  tag) that were 500ing at request time and went unnoticed because the
  route was dynamic. Fixed the min-w-0 truncate bug in 5 more places and
  added layout-guards.test.ts so it cannot ship a third time.
  132 tests, all gates green.
  ** OWNER ACTIONS: (a) db:push for grow journals; (b) Cloudflare cache
  rules; (c) drop 5 promo images into public/promos/; (d) set
  NEXT_PUBLIC_SEED_AFFILIATE_URL. **
- GROW JOURNALS (2026-08-10): "Start a grow the Mr. Canucks Grow way"
  now seeds a real journal. NEW tables `grow` + `grow_event_done`, NEW
  /grows and /grows/[id], NEW grow-journal.ts (pure, 18 tests) and
  grow-journals.ts (persistence). KEY DESIGN: the schedule is NOT
  stored — only inputs (method, pot size, plants, pot-up date) and
  completions; tasks are derived from the method module on every read,
  so improving a method improves every existing journal. Methods live
  in a registry (METHODS) so adding the next grower is data, not a new
  page. Canucks page stays static (form resolves session client-side
  per the existing header decision). 111 tests, all gates green.
  ** OWNER ACTION REQUIRED: run `npm run db:push` against production
  before/after deploying, or /grows will 500 on missing tables. **
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
- OWNER RULE (2026-10-19, Lake Erie Cannabis): "look and share your
  thoughts always before a change". For any edit to the site: look at
  it at the owner's screen size, explain what is wrong and the fix, show
  a before/after mockup (local CSS injection, nothing committed), and
  WAIT for the owner's go before touching code or the live site.
  Owner's desktop viewport is about 1868x935 (Firefox, 1920x1080 screen).
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
- JS BUDGET (audited 2026-08-10, accepted trade-off per performance.md):
  real first-load JS is 153KB gz floor / 156KB on the heaviest content
  page, against a 150KB budget. Measured correctly = a real browser with
  cache disabled and route-prefetch excluded. DO NOT measure by summing
  every <script src> in the HTML: Next emits a ~38.5KB gz core-js chunk
  marked `noModule` that only pre-2017 browsers fetch, and counting it
  inflates every number by ~25% (this mistake was made once already).
  Breakdown: ~144KB is the Next 16 + React 19 App Router framework floor
  (react-dom 69.3, app-router runtime 39.5, router/runtime bits ~35),
  ~9KB is the global OsHeader, and 0-3KB is actual page code. A 150KB
  budget therefore allows 6KB for all application code, which is not a
  meaningful target on this stack. Accepted at 153-156KB rather than
  refactoring the site-wide header for ~5KB. The discipline that still
  matters and still holds: per-page client code stays tiny (the Canucks
  calculator island is +3KB). Revisit only if React/Next slims down or
  field Core Web Vitals degrade — currently LCP 840ms, CLS 0.017 on
  4x-throttled mobile, far inside budget.
  Note: adding a modern `browserslist` does NOT drop the polyfill chunk
  (tried; Turbopack emits it regardless) — and it costs nothing anyway.
### Known issues / TODO
- JS budget: 3-6KB over, not 42KB. See Decisions for the accepted
  trade-off. (An earlier note in this log claimed ~192KB — that was a
  bad measurement that counted the `noModule` polyfill chunk, which no
  modern browser downloads. Corrected 2026-08-10.)
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
