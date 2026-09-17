---
name: design-critic
description: Review a rendered page against the 12 tells of machine-made design, plus the MALACHII visual review order. Use after building any user-facing page, before calling it done, and whenever a build is rejected on how it looks. Requires real screenshots — never review from source alone.
---

# Design critic

Source: MALACHII `quality/VISUAL_REVIEW.md` (review order, anti-genericity test, signature
visual rule, screenshot matrix, scoring). Recorded MISSING/P0 as capability **W05 —
Anti-AI originality evaluation** in the Manus Parity Contract v0.3 (2026-08-31). This file
is that capability.

The twelve tells below were authored for this repo. `06_SKILL_INDEX.md` names a
twelve-tell review but no source file in any supplied package contains the list, so these
are derived from `VISUAL_REVIEW.md`'s six anti-genericity questions plus six failures
observed in a real rejected build (Lake Erie IronRoots, 2026-09). Treat them as this
project's list, not as a recovered artifact.

## Hard requirement

**Review screenshots of the running page, not the source.** Capture at 375px, 768px,
1280px and 1920px, plus: longest realistic content, empty state, error state, keyboard
focus visible, and `prefers-reduced-motion`. A review done by reading JSX is not a review.
Most of these tells are invisible in source and obvious in a picture.

## The 12 tells

Score each 0–4. **0–1 is a finding that must be fixed. 2 is a finding to log.**

1. **Uniform section rhythm.** Every section has the same vertical padding. Real pages
   breathe unevenly — a dense block against a long exhale. Identical `py-*` on every
   section is the single most reliable signature of generated layout.

2. **The default palette.** Near-black background, one saturated accent (gold, emerald,
   violet, cyan), light grey body text. Check: does this palette come from the subject, or
   is it the premium preset? Name the physical thing each color came from.

3. **Gradient-filled text.** Chrome, metallic, or multi-stop gradient on a wordmark or
   headline. Almost never appears in designed work. Nearly always appears in generated work.

4. **Tracked-out uppercase micro-labels.** `text-xs uppercase tracking-widest` as a section
   eyebrow. One is a choice. On every section it is a tic.

5. **Placeholder-shaped holes.** Dashed rectangles, centred grey "image goes here" text,
   empty bordered boxes reserving space for content that does not exist. Also: a layout
   shaped for photographs that has no photographs. Either commit to the asset or redesign
   the composition so nothing is missing.

6. **An invented signature.** A motif introduced because a distinctive site is supposed to
   have one, rather than because the subject produced it. Test: can you explain the motif
   in one sentence that is about the business and not about the design? If the explanation
   is "it represents growth", it is decoration.

7. **Card soup.** Every piece of content in a rounded bordered panel of equal weight. This
   is composition avoidance. Ask which of these actually need to be a card.

8. **Decorative data visualization.** Timelines, charts, progress bars and Gantt-shaped
   rows where the underlying content is not a dataset and the reader has no decision to
   make. A farm's "what's ready" is a board, not a chart.

9. **Glass and glow everywhere.** Backdrop blur, translucent panels, and soft glow applied
   as a global surface treatment rather than to one focal object. Bonus tell: glow behind
   paragraph text.

10. **Copy that narrates the build.** Any rendered text naming a file, a framework, a
    variable, a "placeholder", or explaining that content will exist later. Nothing the
    visitor reads may mention how the site was made.

11. **Symmetric everything.** Everything centred, every grid an even 2 or 3 columns, every
    element the same width. Designed pages use asymmetry and deliberate off-centre mass.

12. **Grayscale collapse.** Screenshot the page with all color removed. If it stops being
    distinctive, the personality was carried by color and glow, not by typography and
    composition — and it will read as generic to anyone who has seen ten of these.

## Review order

Run in this order; stop and report if an early one fails badly.

1. **Task** — is the primary job obvious, is friction proportionate?
2. **Meaning** — does the content survive with atmosphere and motion removed?
3. **Hierarchy** — one deliberate focal path, intelligible rhythm?
4. **Brand** — does this express *this* project, or a fashionable generic aesthetic?
5. **System** — are type, color, spacing, shape, material, imagery, motion and states coherent?
6. **Responsive** — does composition transform intentionally, or is desktop merely shrunk?
7. **Integrity** — are proof, data, logos and live status truthful and licensed?
8. **Cost** — does each effect earn its performance, accessibility and maintenance cost?
9. **Polish** — alignment, crop, clipping, contrast, focus, hover/touch, motion cleanup, edges.

## Anti-genericity test

- If the logo and copy changed, could this be any AI/SaaS site?
- Is the signature visual connected to the brand promise and the user's job?
- Does typography carry personality before glow and imagery do?
- Is every panel needed, or is the design avoiding composition?
- Are data visualizations real and decision-supporting?
- Is "futuristic" a coherent material language, or a pile of neon clichés?

## Signature visual rule

One signature moment should be load-bearing and memorable; surrounding task areas stay
calmer. If every section competes at maximum intensity, the concept has no hierarchy.

## Scoring and reporting

Score 0–4 with a reason **and an artifact** (the screenshot) for: utility, hierarchy,
brand fit, distinctiveness, typography, responsive composition, state completeness,
accessibility, motion meaning, content integrity, polish.

Any critical functional, claim, security or accessibility failure overrides the visual
total — a beautiful page that publishes an unverified claim fails.

Report findings ranked by severity, each naming the tell, the screenshot, and the specific
fix. Do not report an average score; report the minimum. A page is as good as its worst
dimension.

## If the build was rejected by the human

Do not re-skin. Go back to `visual-dna` step 1 and rewrite the subject description. A
rejection on aesthetics nearly always means the art direction was never decided, so
changing colors produces the same page in a different color.
