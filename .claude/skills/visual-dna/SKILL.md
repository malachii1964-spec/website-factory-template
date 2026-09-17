---
name: visual-dna
description: Lock the art direction for a site BEFORE writing UI code. Use when starting a new site or major visual feature, when the human says "make it premium" or gives reference sites, or when a build has been rejected on how it looks. Produces three materially different concepts, then one signed VisualDNA document that the build is held to.
---

# VisualDNA

Source: MALACHII Website Factory Runtime v1.0 §10, ARCHITECTURE.md "Visual intelligence
system", `schemas/visual-dna.schema.json`. Recorded MISSING/P0 as capability **W04** in the
Manus Parity Contract v0.3 (2026-08-31). This file is that capability.

## The rule this exists to enforce

**No UI code before a VisualDNA exists.** Not a mood description in chat. A written
document, committed, that the build can be measured against afterwards.

Without it a build defaults to whatever aesthetic is most common in training data. That
default currently is: near-black background, one gold or emerald accent, a high-contrast
serif headline, small uppercase letter-spaced labels, evenly spaced full-width sections,
and a gradient-filled wordmark. It looks competent and it is instantly recognisable as
machine-made. That is the failure mode. It is not a matter of taste — it is the absence
of a decision.

## Process

### 1. Subject first

Before any adjective, write down what the thing physically *is*. Materials, scale, light,
who touches it, what it smells like, what it sits next to. Art direction comes out of the
subject. A direction that could be pasted onto a different business is not a direction.

### 2. Three materially different concepts

Required for substantial greenfield work, and required after any rejection.

Materially different means they disagree about something structural — light vs dark,
photographic vs typographic vs drawn, dense vs sparse, historical vs contemporary. Three
variations on one idea is one concept. "Combine everything" is not a valid direction.

Each concept gets:

- a name a human can say out loud
- the one-sentence experience thesis
- what carries the page (type / photo / drawing / data / material)
- one signature moment
- **what it deliberately refuses to do**
- honest cost: build time, asset dependency, performance tier, accessibility risk

### 3. Score and select

Score each against: user utility, brand fit, distinctiveness, feasibility, accessibility,
performance cost, content fit, operational burden. Select one. Write down what the selected
direction *does not combine* — that sentence is the thing that stops the build drifting back
to the default.

### 4. Write the VisualDNA

Fill `visual-dna.schema.json`. Required top-level keys:

`schema_version`, `experience_thesis`, `brand`, `composition`, `color`, `typography`,
`material`, `imagery`, `motion`, `responsive`, `render`, `accessibility`, `anti_patterns`

Optional but usually worth it: `spacing_and_shape`, `reference_sources`.

Notes on the fields that carry the most weight:

- **`brand.anti_tone`** — what this must never feel like. Write it before `tone`. It is
  easier to be honest about, and it constrains more.
- **`composition.intensity_map`** — every area gets a level 0–5 and a purpose. If every
  area is 4–5 there is no hierarchy and the page will read as noise. Most areas should be
  1–2. One area is 5.
- **`composition.rhythm`** — if the answer is "the same vertical padding on every section",
  stop. That even machine rhythm is one of the loudest tells. Sections should breathe
  differently depending on what they do.
- **`typography`** — must carry personality *before* color, glow, or imagery does. If the
  page stops being distinctive in grayscale, the type is not doing its job.
- **`imagery.photography`** — if there are no photographs and none are coming, say so here
  and design a composition that has no photo slots. A photo-shaped layout with the photos
  missing reads as broken. A deliberately photograph-free design does not.
- **`render.baseline_tier` / `maximum_tier`** — T0 semantic, T1 CSS/SVG, T2 motion,
  T3 WebGL/R3F, T4 remote GPU, TX WebGPU. Baseline must deliver the whole outcome alone.
  The hero is never an empty canvas or a blocking loader.
- **`anti_patterns`** — required, minimum one, and they must be specific enough to fail a
  build. "Generic design" is not an anti-pattern. "Uniform section padding" is.

### 5. Self-critique before building

Read the VisualDNA back and ask: if the logo and the words changed, could this be any
other site? If yes, it is not finished. Go back to step 1 — the subject was not specific
enough.

## Reference handling

References are decomposed into VisualDNA, never copied as pixel targets. For each
reference record `source`, `take`, `avoid`. Compare at the level of hierarchy, energy,
density, material, typography and emotional outcome. Reject imitation of composition,
assets, or copy. Reference images are evidence of visual *intent* only — their metrics,
logos, testimonials and live panels are not real and do not ship.

## Output

Commit the VisualDNA to the project at `.malachii/visual-dna.json`. Reference it from the
project log. It is the document the `design-critic` skill reviews against, so a build can
fail for departing from its own stated direction, not merely for looking bad.
