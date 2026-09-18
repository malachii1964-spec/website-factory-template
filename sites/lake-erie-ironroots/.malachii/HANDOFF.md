# Lake Erie IronRoots — handoff

Current truth, not aspirational status. Updated 2026-09-18.

## What this is

A site for an organic farm at 154 North Portage St, Westfield NY, growing
indoors in living soil in AutoPots **and** outdoors, **all year round**.

Next 16 App Router, TypeScript strict, Tailwind 4. Eight routes, all static.
No database, no CMS, no client JavaScript on any content route.

## Art direction

Locked in `.malachii/visual-dna.json`; three candidate directions and the
scoring that selected one are in `.malachii/CONCEPTS.md`. Direction **A — The
Ledger**: the site is the farm's open record, set as a printed agricultural
bulletin. Ink on paper, two inks plus one iron-oxide red that means only
"cutting now". No photographs, no dark surfaces, no cards, no glow, no motion.

The direction lists fourteen anti-patterns. Several are enforced mechanically:
`src/lib/palette.test.ts` reads the stylesheet, and `scripts/verify-rendered.mjs`
measures the rendered DOM for rounded corners, shadows, blur and dark surfaces.

This replaced a dark-and-gold build the owner rejected on sight as looking
machine-made. The diagnosis was not a matter of taste — no art direction had
ever been decided, so the build defaulted to the most common aesthetic in
training data. The two capabilities that prevent that (`visual-dna`,
`design-critic`) are installed at the repo root under `.claude/skills/`.

## Data model

`src/lib/crops.ts` — two registers with different physics:

- **bench** — indoors, no season, stated as a cycle ("cut every 14 days")
- **ground** — outdoors, bound by the frost dates in `src/lib/season.ts`

`standing` is **set by the owner and never derived**. The site cannot know
whether the tomatoes have set fruit, and guessing would put the farm's name
behind a guess. Everything is currently `planned`, so the page says "Nothing is
cutting yet" — that is the honest launch state, not a placeholder.

A ground crop marked `cutting` outside its own window is treated as stale data
and suppressed, so the page can never advertise a February field strawberry.

## Verification — run 2026-09-18, real exit codes

| Gate | Result |
|---|---|
| `npm run typecheck` | 0 |
| `npx eslint .` | 0 |
| `npx vitest run` | 0 — 92 tests |
| `npm run build` | 0 — 8 routes, all static |
| `scripts/verify-rendered.mjs` | 0 — 61 checks |
| `scripts/verify-performance.mjs` | 0 — all budgets met |

Measured: LCP 688ms, CLS 0.0009, first-load JS 134.6KB gzipped against a 150KB
budget, on a throttled Pixel 5 profile. Zero horizontal overflow at 320, 375,
768, 1280 and 1920px, and at 200% zoom.

Evidence strength: `LAB_MEASURED`. Nothing here is `DEPLOYED_MEASURED` or
`FIELD_MEASURED` — the site has not been deployed.

## Owner input still needed

1. **Varieties.** Every crop's `varieties` array is empty. The record omits the
   column rather than inventing names; fill them in `src/lib/crops.ts`.
2. **Cycle figures.** The bench day-counts are ordinary published ranges for
   each crop, which is why they are round numbers. They will be wrong for this
   room by some margin until it has run a season.
3. **Standings.** Change `planned` to `growing` or `cutting` as the benches come
   online. That is what turns the launch page into a live one.
4. **Frost dates.** `LAST_SPRING_FROST` / `FIRST_FALL_FROST` are lake-plain
   county figures, not this farm's own records.
5. **Photographs.** None exist and none are faked. When real ones arrive they
   enter as a separate plate section, not as a hero — the composition has no
   photographic slots, so nothing currently reads as missing.
6. **Brand emblem.** The ring-and-roots mark from the owner's artwork is not
   redrawn or approximated. `src/app/icon.svg` is the site's own mark and can be
   replaced when the real file lands in `public/brand/`.

## Claims

No unverified claim is published. Specifically removed during this rebuild:

- "certified-organic" in the meta description — a USDA-enforceable claim
- "the oldest farmed ground of its kind in the country" — an invented superlative
- twenty Chautauqua field crops (sweet corn, Concord grapes, apples, pumpkins,
  garlic, asparagus and more) that the owner had never confirmed growing
- "Open May through November" — contradicted the owner's own year-round hours

The address, phone and email are the owner's confirmed details and are published
per-field: each appears as soon as it is true, rather than behind one combined
flag. Coordinates are deliberately absent; the address is geocoded by the map
provider instead of a guessed pin being asserted as fact.

## Gotchas

- **Fonts for the share card.** `next/font` emits woff2 and satori cannot read
  it, and Newsreader ships variable which satori also cannot parse. The
  committed TTFs under `src/assets/fonts` are static instances with the
  variable tables stripped. A variable TTF dropped in there breaks the build
  with an opaque "cannot read properties of undefined".
- **SVG text does not wrap or shrink.** Figure labels have an exported width
  budget asserted in `src/components/figures.test.ts`, because the first version
  clipped them mid-word and looked fine in source.
- **Measure gates with real exit codes.** `npm test | tail` reports the exit
  status of `tail`, which always succeeds. That has printed PASS over a red gate
  on this project once already.
