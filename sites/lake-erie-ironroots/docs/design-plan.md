# Lake Erie IronRoots — Design Plan

Written before any UI code, per design.md Part 2 Process. Steps 1–3 below; the
build follows step 4 (build exactly to the revised plan, no drive-by additions).

> **Revision 2.** The first version of this plan was written before the owner
> supplied the brand artwork. It proposed a pale glacial-silt palette and a soil
> column. The real identity is iron, burnished gold, storm sky and a root
> system — monumental, not pastoral. The plan below is derived from the artwork
> itself. The earlier version is superseded in full.

## 1. The subject

**Lake Erie IronRoots** — an organic fruit and vegetable farm in Chautauqua
County, New York.

### What the brand artwork actually says

Read straight off the supplied identity, because the design has to come from
the client's own world, not from "modern web" taste:

- **The mark is a root system.** A forged metal ring with an anchor-like cross
  inside it, and beneath it a wide, glowing **golden root network** spreading
  into black rock. Roots are the central image, and they are *lit*.
- **The setting is the breakwall at sunset** — lighthouse, wet black stone,
  storm cloud, an ember horizon on the water. Not a field. Not a barn.
- **The materials are iron and gold.** Beveled, engraved, catching a single
  light source. The wordmark is cut, not printed.
- **The voice is already written:** *Built on purpose. Rooted in strength.*
  Plus five pillars — Built on Purpose · Rooted in Strength · Guided by
  Integrity · Inspired by Nature · Cultivating Legacy.

### The land (true, and it earns its place)

The farm sits on the **Lake Erie plain**, a narrow shelf between the lake and
the escarpment. The Concord Grape Belt along it is the **oldest and largest of
its kind in the world** and became **New York's first Agricultural Heritage
Area** in 2006. The **Chautauqua soil series** — the series this county is
named for — is a gravelly silt loam published in Munsell notation as
**10YR 4/4, "dark yellowish brown."** That color is **iron oxide**. The farm is
called IronRoots; the name is the literal color of the ground. And the lake
works as a **thermal battery** — slow to charge, slow to drain — holding spring
back past the killing frosts and holding autumn open, which is why first frost
here lands near **7 October** instead of weeks earlier.

**Audience:** people within driving distance, plus seasonal lake visitors,
buying food directly from the farm.

**The home page's single job:** make a local believe this is a real, serious
farm — then tell them what is ready *right now* and how to come get it.

## 2. The plan

### Colors — seven, named, every one pulled from the artwork

| Token | Hex | What it is in the image |
|---|---|---|
| `--pier` | `#0C0F12` | Cold near-black of wet breakwall stone. The page ground. |
| `--shale` | `#171B1F` | One step up. Raised surfaces, bands, cards. |
| `--iron` | `#8C9296` | Cold steel of the emblem. Body text on dark, rules, structure. |
| `--gold` | `#C79A3C` | Burnished gold of the roots. Hairlines, the root line, borders. |
| `--gold-lit` | `#F0D08A` | Where the light catches the metal edge. Display type, used small. |
| `--ember` | `#E2702A` | The sun on the horizon. **The only hot color.** Reserved for "ready now" and the primary action — nothing else may use it. |
| `--ironroot` | `#6E5232` | **Munsell 10YR 4/4**, the real Chautauqua soil. The earth band. |

One light token, `--parchment` `#EDE8DC`, grounds the single inverted section
(the produce list). The site is otherwise dark. That one reversal is the
lake-against-land tension made structural, and it keeps a long list of
vegetables actually readable on a phone in daylight.

**Gold is a hairline, not a fill.** Metal in the artwork is thin, lit edges
against mass. Large gold areas would read as a cheap luxury template; 1px gold
rules and small lit type read as the forged mark.

### Type — two variable families, self-hosted via next/font

- **Display: Bodoni Moda** (variable, optical-size axis). Engraved-plate
  serif — heavy stems, razor hairlines. That stem-to-hairline jump *is* the
  beveled metal of the wordmark: mass with a lit edge. Set large and sparingly.
- **Body and labels: Archivo** (variable weight). The industrial counterweight,
  and it is already in the artwork — the letterspaced `LAKE ERIE` and the five
  pillar captions are a wide-tracked grotesk. Small, uppercase, wide tracking
  reproduces the brand board's own label style exactly.

Two families, four weights total — inside the performance budget, no third face.

### Layout concept — descent

The page descends: storm sky, then horizon, then waterline, then rock, then
soil. Sections get warmer as you go down, ending in `--ironroot` — delivered as
one gradient across `<main>` (`.descent`) rather than as per-section colours,
so there is a single place it can go wrong.

### THE SIGNATURE — the Root Line

**A root grows down the page, and each section grows its own branch off it.**

- **The trunk** spans the full height of the document — measured at 4826px of a
  5308px page, not one viewport. It is a filled *taper*, 3.6px where it enters
  and 1.2px where it ends; at a uniform width it read as a border-left, which is
  the whole difference between a root and a rule. A fill rather than a stroke,
  because it stretches to a page height nobody knows at build time and a
  stroked path would distort.
- **Each branch is rendered by its own section**, so its position is that
  section's position by construction and cannot drift. It forks once more and
  terminates in a lit node level with that section's heading — which is what
  turns the left gutter into a table of contents and makes the asymmetric
  layout earn its width.
- **The spread** — the root network the brand mark is built around — fans out
  where the trunk reaches the soil section at the foot of the dark half.

Drawn by native CSS `animation-timeline: view()`: a view timeline is scoped to
an element's own progress through the viewport, so a branch is tied to its
section with no scroll percentages to keep in sync. **Compositor thread. Zero
JavaScript. Zero library.**

Degradation is measured, not asserted (scripts/verify-rendered.mjs):

| Condition | Result |
|---|---|
| `prefers-reduced-motion: reduce` | 14 paths present, 0 animated, 0 undrawn |
| No `animation-timeline` support | Base rule sits outside `@supports`, so everything renders fully drawn |
| Below 768px | Trunk only, in its own viewBox framed on the trunk; branches hide |

> **What this replaced, and why it is written down.** The first version was a
> `position: fixed` SVG whose branch endpoints were magic numbers in *viewport*
> coordinates. It looked like a root and meant nothing — the branches landed
> wherever the window put them, related to no section and no anchor, and
> `slice` meant there was no window size at which the whole drawing was
> visible. design.md requires structure to encode something true about the
> content, so either this document's claim went or the code did.

### The quieter second instrument — the Season Rule

A horizontal band running **last spring frost → first fall frost**, each crop's
harvest window drawn as a segment in gold, the segments that contain today lit
in ember, and a marker for today. It answers "what is ready" without a
sentence of copy, and it is specific to this county's real frost dates.

## 3. Self-critique

**Would I produce this plan for any similar brief?** No. Drop another farm into
it and it falls apart: the root line is this client's mark, the ember rationing
is this client's horizon, the soil band is this county's published Munsell
color, and the season rule is this county's frost dates.

**What I nearly defaulted to, and cut:**

- *Cream ground + high-contrast serif + terracotta accent.* design.md's first
  banned tell, and exactly what "organic farm" pulls out of a model. The
  artwork ruled it out before I could ship it.
- *Gold gradients and glow everywhere.* The fastest way to make a premium brand
  look like a crypto landing page. Gold is rationed to hairlines and small lit
  type; there is no gold fill anywhere.
- *A hero of big number + small label.* Banned, and it would waste the one
  image this brand already owns.
- *A segmented horizontal bar as the hero signature.* Structurally too close to
  a signature I have built before. Demoted to the secondary instrument.

**One accessory removed before building** (design.md: "remove one accessory"):
scroll-driven **variable-font width-axis** headings. Technically possible now
and it would feel futuristic — but animating `wdth` reflows text and risks CLS,
and it would compete with the root line. Boldness is spent in one place. Cut.

## 4. Build notes

- Server Components throughout. The root line and season rule are inline SVG
  plus CSS; **no client component is added for decoration.**
- `prefers-reduced-motion` stops the root from drawing and the marker from
  animating. Both stay fully legible as static instruments.
- Browsers without `animation-timeline` get the root fully drawn and static —
  it degrades to an illustration, never to nothing. Measured, not assumed; see
  the degradation table above.
- 375px is designed first. Below 768px the root uses a second viewBox framed
  on the trunk — the desktop one clipped it out of the box entirely, so the
  signature was absent on the device most of this farm's customers use. The
  Season Rule fits the screen rather than scrolling: a bar scrolled off-screen
  reads as "we do not have that".
- The emblem is the owner's asset. Until the file is supplied the hero renders
  a typographic lockup in the brand's own letterspacing — **no invented
  emblem**, because faking a client's mark is worse than omitting it.

## 5. Open factual conflict (for the owner)

The artwork reads **ESTD 2024**. The owner stated **Established 9/1/26**. The
site uses a single constant for this, set to the owner's stated date. One of
the two needs correcting before launch — flagged, not silently chosen.
