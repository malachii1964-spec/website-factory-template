# Mark and scene matrix

Factory law: a logo is not the site. Distinctiveness is E02 (signature object) plus a mark that survives shrink, invert, and a 16px favicon.

This file exists because logo chats collapse into “try again, that looks similar” with no rubric. Similarity without a matrix is guaranteed.

## When to use this file

- FutureDesk, THCMed, REZ RUNNER, any brand-led Factory job.
- **Not** the default for IronRoots. IronRoots signature is the Harvest Wheel + `Wordmark` type, not a WebGL ident.

VisualDNA still wins: `brand`, `imagery`, `render.baseline_tier`, `anti_patterns`.

## Construction types (pick 3 different types per round)

A round that outputs six wordmarks in Inter is one idea, six times. FAIL.

| Code | Type | What it is | Earns when |
|---|---|---|---|
| W | Wordmark | Name as the mark | Name is short and speakable |
| L | Lettermark | 2–3 letters | Long name, app icon needed |
| P | Pictorial | Recognizable thing | The thing is unique to the subject |
| A | Abstract | Geometry that is not a clip-art object | Category is crowded with the same object |
| E | Emblem | Type locked inside a badge | Physical goods, stamps, hats |
| C | Combination | Icon + word, separable | You need both a tiny icon and a sign |

Every candidate sheet must label **W/L/P/A/E/C**. Two of the same code in one row only if silhouette and color mass differ.

## Crop / delivery formats (ship these, not one PNG)

| Code | Crop | Test |
|---|---|---|
| H | Horizontal lockup | Nav 32–40px tall |
| S | Stacked | Square social |
| I | Icon only | 16px and 32px |
| M | Mono | One ink, no gradient |
| R | Reverse | On the brand’s darkest field |
| F | Favicon | 16px, still the same mark |

A mark that only works as a 1200px glass render is not a logo. It is a poster.

## Rendering modes (the “formats” people mean after FutureDesk)

Use as **exploration rows**, then pick **one** production mark + optional motion ident.

| Code | Mode | Factory tier | Trap |
|---|---|---|---|
| V | Flat vector | T0 | Default SVG slop |
| G | Glass / refractive | T2 | Every AI SaaS 2024–26 |
| N | Neon / line-light | T1–T2 | Cyber pack without a subject |
| K | Metal / machined | T2 | Unrelated to food or farms |
| D | Volumetric 3D still | T2 | LCP bomb if used as hero img raw |
| X | Realtime 3D ident | T3 | See `immersive-3d.md` |
| Z | Stamp / ink / print | T0 | Cute until it is unreadable |
| Q | Motion loop (2–4s) | T2 | Cannot replace the static mark |

Production site uses **V + I + F** always. G/N/K/D/X are campaign or hero-only if `render.baseline_tier` still completes the job with V.

## Diversity rubric (why the last chat failed)

A new candidate is **dead on arrival** if it matches an existing one on ≥2 of:

1. Silhouette (blob / ring / monogram block / orb)
2. Color mass (same indigo, same gold, same lime)
3. Type genre (same geometric sans, same wide grotesque)
4. Material (all glass, all chrome)
5. Metaphor (all “neural node”, all “leaf”)

“Try again” without naming which of the five collided will reproduce the same mark.

Required prompt line for any logo generator:

```
Produce a 3x3 sheet. Rows = construction types W, L, C (or named). Columns = modes V, G, D.
No two cells may share silhouette AND color mass.
Label each cell with type+mode+one-line metaphor.
Do not average the nine into a tenth “winner mashup.”
```

## 3D sites (do not confuse with logos)

Law is already in `immersive-3d.md`:

- LCP is never the canvas
- Poster fallback for mobile / reduced-motion / no WebGL
- ≤1.5MB 3D payload, one canvas, pause off-screen
- Subject must earn 3D (product in space, route, machine) — FutureDesk/REZ may; IronRoots farm shop must not depend on it

3D **ident** (small mark spinning) ≠ 3D **page**. Ident can be T2 in the header if a V mark is in the DOM for T0.

## FutureDesk vs IronRoots

| | FutureDesk / REZ | IronRoots |
|---|---|---|
| Mark | Combination or lettermark; explore G/N/D | Wordmark already in `wordmark.tsx` |
| Signature | Product/UI motion or 3D desk/route | Harvest Wheel |
| Baseline tier | T1, max T3 with poster | T0/T1 |
| Logo redo in launch | Allowed as a *separate* task lock | Out of scope for preview launch |

## Task split

Logo matrix = its own Task Lock (`scopePaths: design-library + public marks`).
IronRoots preview URL = existing `ironroots-preview-2026-09-01` lock. Do not merge them.
