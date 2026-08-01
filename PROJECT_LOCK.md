# PROJECT_LOCK — Living Memory
> The orchestrator READS this at the start of every session and UPDATES it at the
> end. This is the single source of truth for what's decided, what's open, and
> what happens next. If it's not written here, it isn't remembered.

Last updated: 2026-07-25

## The mission (one line)
Launch a countywide on-demand delivery / errands / courier / concierge service in
Chautauqua County, NY — filling the void left by Pip's Delivery (closed Mar 2026),
better on every variable. Owner: Malachi.

## Decisions LOCKED (do not relitigate)
- **NAME LOCKED: Chautauqua County Courier** (owner Malachi + wife approved,
  2026-07-25). Yields the CCC triple-C monogram; "Triple-C"/"CCC" carries the
  verbal/phone load so no one has to spell "Chautauqua." Sub-services (incl.
  "Reservation Runs") are line items UNDER this master brand.
- Build approach: the "local-business" template, extended with a guaranteed-quote
  request intake. Boring, small, fast — per stack defaults.
- The team: 9 specialist agents in `.claude/agents/` + main session as orchestrator,
  with a written dispatch router in CLAUDE.md. Evidence gates are hard.
- Brand shortlist narrowed to 3 finalists (see OPEN #1). Sub-services (e.g.
  "Reservation Runs") are line items UNDER the master brand, not their own brands.
- St-Jude-style pledges / any charity claim: only in the brand's own words, never
  implying official partnership. (Carried over from factory standing rules.)

## OPEN — needs the owner (blocking the build)
1. **Named dispatcher / face of the brand** — brand-critic's key fix: our "one
   local person" edge is copyable as a slogan; making a REAL named dispatcher the
   center of the brand ("same name, same number, every time — you talk to ___")
   turns it into a moat. Who is it? (Malachi? spouse? both?) Blocks final copy.
2. **Interview answers 2–8** unanswered: phone number, hours, service area,
   which of the 8 services launch, pricing display (formula-only vs real starting
   rates), request-intake method, legal-exclusions page, look/feel reference.
3. **Pricing inputs** missing: vehicle + MPG, labor rate, insurance cost, avg
   route distance, time per job. pricing-strategist is blocked until these exist.

## RISKS / must-verify (truth+evidence hard gate)
- Domain: SECURED ✅ chautauquacountycourier.com (owner bought it 2026-07-29).
- Still open: NY entity search + LLC/DBA, and USPTO trademark — owner/lawyer,
  before heavy brand spend. Not blocking a soft launch on the owned domain.
- NY delivery legality: cannabis/alcohol/tobacco/Rx are restricted — compliance
  advisor must shape the "what we can/can't carry" copy before launch claims.
- Insurance/licensing (commercial auto, liability) unconfirmed — owner + insurer.

## NEXT ACTION (what the orchestrator does next)
Owner picks the name → dispatch brand-strategist (positioning, tagline, message
hierarchy) → brand-critic review → then collect interview answers 2–8 → build.

## Brand foundation
- BRAND.md is now LAW (positioning, tagline "One call. Consider it done.", 3 proof
  pillars, voice, branded-house architecture, CCC logo direction). Built by
  brand-strategist, red-teamed by brand-critic (verdict FIX-THEN-SHIP), all copy
  fixes applied. Truth gates ("insured", "guaranteed price", restricted items) +
  named-dispatcher moat still open (see RISKS / OPEN).

## Build state
- HOME PAGE LIVE (branch, not deployed). "Dispatch Desk" design: warm-paper light
  default + aubergine dark, Concord-grape + marigold + Lake-Erie-teal, Bricolage/
  Hanken/Spline Mono, signature = animated Chautauqua County route map + CCC
  monogram. Sections: hero (tap-to-call ticket), trust strip, 8 services in 3
  buckets, how-it-works, coverage, honest pricing model, can/can't-carry, CTA.
  All Rule 3 gates green; verified in browser (desktop light/dark + 375px).
  design-critic run (Rule 6): verdict FIX-THEN-SHIP; all findings ≤3 fixed —
  WCAG AA contrast on marigold CTAs (dark ink foreground), grape eyebrow/step
  numbers, larger non-clipping map labels, 44px tap targets. Re-verified.
- Old FutureDeskAI pages (/products, /membership, /about, /local-business,
  /free-toolkit, /checkout, /legal, /api/*) STILL PRESENT on this branch, now
  off-brand/unlinked. TODO: remove or rebuild for CCC. They build fine but should
  be cleaned before deploy.
- PLACEHOLDERS in code: site.phoneDigits (716-555-0176, fake), hours. Swap before
  launch. Quote intake is currently tap-to-call/text only (no form/API yet).

## Signature experience — "The Dispatch Board" (blueprint approved by creative-technologist)
Flagship hero concept: the county map becomes an OPERABLE surface. User taps
pickup + dropoff → route draws along the real corridor → courier-dot runs it → a
manifest ticket assembles CCC's 4-part ballpark (dispatch min + mileage + time +
stops) → "Send this run" serializes to /request (prefilled). Differentiator made
physical: pins MAGNETIZE only to the 9 real towns (can't dispatch into a void =
"we know this county"). Honest ballpark, never a fake instant price (truth gate).
Tech: SVG + CSS + thin JS (WAAPI), NOT WebGL — right for rural-senior audience +
perf budget. Progressive enhancement: Tier0 static SSR SVG (LCP) → Tier1 operable
board + keyboard + dropdown fallback → Tier2 ambient (time-of-day tint, optional
snow, gated off on reduced-motion/save-data). Call button present at every tier.
FIRST BUILD: refactor county-map.tsx nodes → focusable buttons; add pick-up/drop-off
control (click-two-nodes + 2-select fallback) that redraws route + stamps a 4-part
ballpark into a .ticket manifest; "Send this run" → /request. Needs a small pairwise
road-miles model (node distance × ~1.3 × per-mile rate, labeled BALLPARK).
STATUS: awaiting owner GO to build the first piece.

## Session log (newest first)
- 2026-07-25: Locked name (Chautauqua County Courier). Ran brand-strategist →
  brand-critic → wrote BRAND.md with fixes. Dispatched compliance-advisor on the
  three legal live wires (insurance/"insured", "guaranteed price", restricted-goods
  can-carry table) + privacy/data-minimization. Awaiting: named-dispatcher decision
  + interview answers 2–8 + compliance-advisor results.
- 2026-07-23: Built 9-agent roster + dispatch router (CLAUDE.md) + this memory
  file + autonomy policy. Scored names against the OS-doc rubric; recommended
  GO-TO 716 (runner-up WE GOT YOU 716 / GRAPE ROUTE). Awaiting name lock.
