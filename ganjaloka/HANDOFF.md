# GANJALOKA — Project Hand-off

**For:** a new Claude project continuing GANJALOKA.
**Written:** 2026-10-20, at the end of the first build session.
**Code:** GitHub `malachii1964-spec/website-factory-template`, branch
`claude/magical-rubin-clouns`, folder `ganjaloka/`.

Read this file first, then `docs/README.md`, then the code.

---

## 1. What GANJALOKA is
A **21+ social network for cannabis culture**: Facebook-style profiles and
follows, Twitter/X-style posts, replies and reposts, and (phase 2)
YouTube-style video. Web first, then iPhone + Android apps on the same
backend. *Ganja* + Sanskrit *loka* = "the cannabis world".

**Owner:** Malachi (GitHub `malachii1964-spec`), New York.
**Non-negotiables:** 21+ only · no buying or selling of cannabis · report +
block everywhere · photo location data stripped · account deletion in-app.

## 2. How the owner wants to work
- **Carry 90%+ of the work.** Interview once, then build without check-ins.
  Ask only when a wrong guess wastes hours. State assumptions and proceed.
- **The owner's "MALACHII Runtime" style:** lock the objective, verify claims,
  red-team your own work, repair, never fabricate (laws, prices, test results,
  "done"), say what's unverified. Quality bar: "better than the best in the
  field." In practice: tested code, real verification, honest status.
- **Short, plain updates.** The owner often writes by voice-to-text; read for
  intent.
- **Repo rules live in the root `CLAUDE.md`** (interview first, stack
  defaults, validation gates, design.md, performance.md). They apply here.

## 3. Decisions already made (don't relitigate)
| Decision | Why |
|---|---|
| Lean managed stack: **Next.js 16 + Supabase (Postgres/Auth/Storage/Realtime) + Mux (video, phase 2) + Expo (mobile, phase 4) + Vercel** | The AI-Mode "Facebook clone" (Nginx + Go + NestJS + RabbitMQ + FFmpeg + Redis sharding) was reviewed and rejected: it didn't run (broken imports, wrong service names, fake uploads, broken URLs) and is far too heavy for the user count |
| App lives in `ganjaloka/` inside the website-factory repo; FutureDeskAI at the repo root is untouched | Owner's choice ("a") |
| Security boundary = Postgres RLS + column grants + triggers; writes go through server code (Server Actions now, `/api/v1` for mobile later) | One trusted write path for validation, the content filter and rate limits |
| Fan-out-on-read feeds with keyset pagination | Enough until the metrics in `docs/02` say otherwise |
| Content filter blocks **slurs and sales solicitation only**, not normal adult swearing | 21+ community; App Store 1.4.3 / Play marijuana policy |
| Design "Night Tent": plum-black ground, Resin Amber accent, no green, Big Shoulders + Atkinson Hyperlegible Next, signature = like button is a trichome that ripens clear → milky → amber | See `docs/11-design-system.md` |
| shadcn-style components hand-written (Radix + Tailwind) | The shadcn registry is blocked from the build environment |
| **No secrets in git.** Keys only in `.env.local` | GitHub push protection blocked a commit containing the (public) local Supabase key; history was rewritten before the first push |

## 4. What's built (all on the branch)
- **Spec package** `ganjaloka/docs/01–11`: product, architecture, data model,
  API contracts, screens, trust & safety/compliance (App Store 1.2, 1.4.3,
  5.1.1; Play UGC + marijuana; 21+; CSAM/NCMEC + REPORT Act; DMCA; privacy),
  video pipeline (Mux), mobile (Expo), roadmap, ChatGPT hand-off prompt, design system.
- **Database** `supabase/migrations/`: profiles, posts (post/reply/repost),
  likes, follows, blocks, reports; 21+ sign-up trigger (birth date kept
  private, scrubbed from JWTs); rate limits; block enforcement; moderation
  RPC; feed RPCs; storage buckets with per-user folders.
- **Web app (phase 1):** age gate, sign-up / log-in / reset with email links,
  home / explore / profile / thread pages, composer with in-browser photo
  metadata stripping, likes (ripeness trichome), reposts, replies, follows,
  report + block + delete menus, moderator queue, settings (profile, avatar,
  password, blocked list, delete account), legal drafts (Terms, Privacy,
  Guidelines, Contact), security headers, landing page.
- **Tests:** 80 unit tests (pass), 35 DB security tests run as real members
  against local Supabase (passed before the last refactor of key loading —
  re-run), Playwright end-to-end script `e2e/run.mjs`, seed script.
- Gates last run: `tsc` ✅ · lint ✅ · `next build` ✅ · unit ✅.

## 5. Open work, in order
1. **Fix React error #441** — appears in the browser after clicking "I'm 21
   or older" on `/age` (production build). Not yet diagnosed. Reproduce on
   `pnpm dev` to read the full message. Suspects: the `confirmAge` server
   action called from a plain `<form action>` on a page that also redirects;
   or the age page's `searchParams` usage.
2. **Re-run all gates:** `pnpm test:db` (after the `.env.local` key change),
   then the full `pnpm e2e` (age gate → sign-up incl. under-21 failure →
   email confirm via Mailpit → sales-post blocked → photo post with GPS JPEG
   → follow / like / repost / reply → report / block → delete account).
3. **Font fallback:** `next build` warns it can't generate size-matched
   fallbacks for both fonts → measure CLS; set `adjustFontFallback`/fallbacks if needed.
4. **Reviews required by `CLAUDE.md`:** a code-review pass (fix critical/high)
   and a design-critic pass on the screenshots in `e2e/screenshots/`.
5. Update the root `CLAUDE.md` Project Log, commit, push.

## 6. Next feature: "Grow Lab" (proposed, awaiting owner's go)
The owner brought a set of 12 AI grow tools + a router (written with Grok):
Environment Diagnostic, IPM Triage (with an outdoor add-on), Harvest & Cure
Calculator, NY Compliance Checklist, Living-Soil Feeding Calendar, Light &
DLI Helper, Flush/Finish Guide, Phenotype & Keeper Notes, Clone & Mother
Manager, Cost-per-Gram Tracker, Sustainability Log, Problem-Solution
Library, and a Grow Session Router, plus indoor and outdoor tool paths.

**Review given to the owner:**
- Keep: environment-before-nutrients logic, act/monitor/ignore outputs,
  tool-to-tool handoffs, outdoor rain/frost as a harvest decision, disclaimers.
- Fix: add **pH and EC/PPM** to diagnostics (most lockout-looking symptoms are
  root-zone pH); make the DLI helper actually compute DLI
  (PPFD × hours × 0.0036; roughly veg 25–40, flower 35–45 mol/m²/day without
  CO₂); use leaf temp to compute *leaf VPD* instead of flagging the delta;
  support **autoflowers**; show NY plant limits with "verify" (as understood:
  3 mature + 3 immature per adult 21+, max 6 + 6 per household, private
  residence, secured, not publicly visible — **verify against NY OCM before
  shipping**); add NY's cannabis pesticide restrictions to IPM; make
  compliance **state-selectable** (GANJALOKA is national).
- Architecture: most tools are **deterministic, tested code** (VPD, DLI,
  harvest window, plant counts, cost per gram, feeding calendar). Use
  **Claude (Anthropic API)** only for photo-based IPM triage and the
  plain-English router. Grow journals attach tool readings to posts.

**Questions still open for the owner:**
1. Finish phase 1 first, then Grow Lab as phase 1.5 (recommended)?
2. First four tools: VPD Diagnostic (+pH), Light/DLI, Harvest & Cure, IPM photo triage?
3. Free for all members, or AI photo triage for members only (costs per photo)?

## 7. How to run it
```bash
cd ganjaloka
pnpm install
# Docker must be running (the container may need: dockerd &)
pnpm db:start          # local Supabase; images pulled from Docker Hub
cp .env.example .env.local
pnpm exec supabase status   # copy Publishable + Secret keys into .env.local
pnpm seed              # demo members: nightgrower / terpene_tasha / hashmaker_ray
pnpm dev               # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm test && pnpm test:db
pnpm build && pnpm start  # then, in another shell: pnpm e2e
```
Environment notes from the first session: the AWS ECR registry is blocked
(use `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`, already in `db:start`);
supabase.com and support.google.com docs weren't fetchable from the container;
don't kill processes with `pkill -f`/`pgrep -f` patterns that match your own
shell — kill exact PIDs.

## 8. Owner-side activation (before a public launch)
Supabase hosted project + keys · paste email templates from
`supabase/templates/` into Supabase Auth · Resend SMTP · Vercel project
(Root Directory = `ganjaloka`) · domain + `NEXT_PUBLIC_CONTACT_EMAIL` ·
LLC (needed for the Apple developer account) · lawyer review of legal drafts ·
DMCA agent · NCMEC registration · at least one trained moderator.
Phase 2 adds a Mux account.

## 9. Side projects mentioned (not part of GANJALOKA)
- **Lake Erie Cannabis "The People's Grow"** — a free, live Box-to-Bowl
  grow series, with an announcement page drafted as a Claude artifact. The
  owner said to set it aside ("forget the people's grow").
- A ChatGPT interview packet for the owner's life story (given in chat).
