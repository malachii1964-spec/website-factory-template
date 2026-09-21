# Design System — Taste Layer
# Part 1 is YOUR taste (fill once). Part 2 is LAW regardless of Part 1.

## PART 1 — My taste (fill in once; delete lines you want the agent to decide)
- Site I love the look of: [url]
- Second reference: [url]
- Never make it look like: [url or vibe]
- Base mood: [light / dark / toggle]
- Density: [airy and editorial / compact and app-like]
- Corners: [sharp / slight / round]

## PART 2 — Design law (applies to EVERY build, non-negotiable)

### Process (before writing any UI code)
1. Ground it in the subject: name the site's ONE subject, audience, and the
   page's single job. Distinctive choices come from the subject's own world —
   its materials, artifacts, vernacular — not from generic "modern web" taste.
   Ask: what physical sensation should the page evoke in the first 3 seconds?
   If this site were a physical material, what would it be made of?
2. When the brief is open or the human has no reference, generate THREE
   genuinely different concepts through distinct artistic lenses — pick the
   three that fit the subject:
   - **Editorial / Typographic** — type as the hero; magazine composition;
     confident whitespace; almost no ornament.
   - **Spatial / Cinematic** — depth, light, camera framing; the page as a
     scene; motion serves narrative.
   - **Crafted / Organic** — texture, imperfection, hand-made warmth, natural
     materials and rhythm.
   - **Restrained / Systemic** — precision, grid broken deliberately, engineered
     calm, product-grade clarity.
   Score all three against: brand truth, audience utility, originality, content
   fit, accessibility, performance, build cost. Commit to the winner and state why.
3. Write a compact design plan: 4-6 named hex colors, 2+ typefaces with roles
   (characterful display used with restraint + complementary body), a layout
   concept, and THE SIGNATURE — the single element this site is remembered by.
   The winner earns exactly ONE signature interaction. Distinctiveness comes from
   composition and the signature moment, never from stacking effects everywhere.
4. Self-critique the plan: would you produce this same plan for any similar
   brief? If yes, it's a default, not a choice. Revise before building.
5. Build exactly to the revised plan. Every color and type decision derives
   from it — no drive-by additions.

### Banned defaults (the AI tells — never ship these uninstructed)

Two pattern families are banned. Either may appear ONLY if the brief genuinely
demands it AND the choice is defended in writing, tracing back to the sensation/
material answers from the design plan.

**Generic AI look** (the base template):
- Gradient heroes (color wash behind the headline as default chrome)
- Centered hero + three-column feature cards as page structure
- Flat white or gray template surfaces; unmodified component-library styling
- Generic geometric sans (Inter, DM Sans, etc.) as the sole typeface
- Rounded-everything (cards, buttons, avatars all at the same radius)
- Stock illustration packs or Lottie files as visual substance
- Lorem ipsum anywhere in a shipped build

**"Premium AI" look** (the dark variant of the same template):
- Obsidian/near-black + neon purple/emerald glow blobs as default atmosphere
- Glassmorphic panels and gradient-border cards as structural elements
- Gradient progress bars, shimmer loaders, and particle fields as decoration
- Constant morphing, breathing, or parallax that serves no narrative purpose
- Purple-to-blue gradients on white; neon accent on dark as the only personality

**Also banned regardless of family:**
- Cream/#F4F1EA background + high-contrast serif + terracotta accent
- Near-black background + single acid-green or vermilion accent
- Broadsheet look: hairline rules, zero radius, dense newspaper columns
- Numbered section markers (01/02/03) unless content is truly a sequence
- Hero = big number + small label + gradient accent (the template answer)

### The rules
- Typography carries the personality. If the type were swapped for defaults
  and nobody would notice, the design has no personality yet.
- Spend boldness in ONE place (the signature); keep everything around it
  quiet and disciplined. Before shipping: look in the mirror, remove one
  accessory.
- Structure is information: dividers, labels, eyebrows must encode something
  true about the content, not decorate it.
- Motion: one orchestrated moment beats scattered effects. Subtle hovers fine.
  Respect prefers-reduced-motion.
- Copy is design material: active voice, plain verbs, buttons say exactly
  what they do ("Save changes" not "Submit"), errors say what went wrong and
  how to fix it, empty states invite action. Write real copy, never filler.
- Quality floor, unannounced: flawless at 375px width FIRST, visible keyboard
  focus states, honest contrast ratios, designed loading/empty/error states.

### Verification
After building any user-facing page, screenshot it (or render it) and look at
it before calling it done. Then dispatch the design-critic agent. A page no
one has LOOKED at is not finished.
