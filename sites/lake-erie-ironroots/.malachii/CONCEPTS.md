# Lake Erie IronRoots — concept directions

Gate G2/G3. Produced under `.claude/skills/visual-dna`. No UI code until one is selected.
Supersedes the visual layer of the 2026-09 build, which the owner rejected.

Status of facts below: `USER_PROVIDED` unless marked. Nothing here is published.

---

## 1. The subject, before any adjective

Not a field. **A room.**

- Indoor growing at 154 North Portage St, Westfield NY. Established 2024.
- Organic **living soil** — dark, crumbly, biologically alive. Worms, fungal networks,
  amendments (kelp, crab, neem, basalt). Smells like forest floor. Ancient, uncontrollable.
- Grown in **AutoPots** — engineered plastic trays, a reservoir, gravity-fed valves.
  Precise, repeated, identical, modern. A grid.
- Lit by fixtures on a timer. No weather. No frost. No mud. No barn. No season.
- Hours are Mon–Fri 8–5 and Sat 9–1, which is a **workshop** schedule, not a farm-stand one.

**The tension that is the whole brand:** something wild and biological, running inside
something engineered and exact. The owner's existing tagline already says it —
*"Built on purpose. Rooted in strength."* Purpose is the hardware. Roots are the biology.

Any direction that would work just as well for a roadside stand with a cornfield behind it
is wrong, because that business is not this business.

---

## 2. Three directions

### A — THE LEDGER

**Thesis:** The site is the farm's open record. You trust it because you can read exactly
what is in the room and what was done to it.

- **Carried by:** typography and real records. Agricultural bulletin, seed catalogue, lab
  notebook. **Light** — paper, not black.
- **Signature:** the running log. Every crop in the room, what week it is in, what was last
  amended and when. Kept like a stockman's book, set like a printed table. It grows more
  impressive the longer the farm operates.
- **Refuses:** photography, dark backgrounds, glow, cards, gradients, hero imagery.
- **Cost:** lowest. T1. **Zero asset dependency — buildable today.** Accessibility is
  inherently strong because it is text and tables.
- **Risk:** if the type is not excellent it reads as plain. Everything rides on typography.

### B — THE ROOM

**Thesis:** You are looking into the grow room itself. The site's layout *is* the room's
layout.

- **Carried by:** the grid — the AutoPot tray pattern as the page's actual structure.
  Dark, but **grow-room dark**: LED magenta and hard white, not luxury near-black.
- **Signature:** a plan view of the room where each cell is a real position you can open to
  see what is in it.
- **Refuses:** serif elegance, paper warmth, decorative botanicals.
- **Cost:** medium. T1–T2. Needs a real map of the room and per-position data.
- **Risk:** high — this becomes a dashboard, which is tell #8 (decorative data
  visualization) and lands close to the dark-plus-accent default that was already rejected.

### C — THE SOIL

**Thesis:** The page is a soil profile. You descend through it.

- **Carried by:** material and drawing. Real Munsell soil colors (already in the codebase
  from the earlier build). Hand-authored SVG cross-sections — the AutoPot cutaway, the
  living-soil column, the soil food web.
- **Signature:** scrolling downward genuinely descends through horizons, with content
  living at the depth it belongs to.
- **Refuses:** photography, light paper, flat layout.
- **Cost:** medium-high. T1–T2. Every drawing is hand-built and slow.
- **Risk:** the descent is a gimmick unless the content truly belongs at each depth. Also
  dark again, which is the direction that was just rejected.

---

## 3. Scoring

| | A Ledger | B Room | C Soil |
|---|---|---|---|
| User utility | 4 | 3 | 2 |
| Brand fit | 4 | 4 | 3 |
| Distinctiveness | 4 | 3 | 3 |
| Feasibility today | 4 | 2 | 2 |
| Accessibility | 4 | 2 | 3 |
| Performance cost | 4 | 3 | 3 |
| Content fit (pre-launch) | 4 | 1 | 3 |
| Operational burden | 3 | 2 | 3 |
| **Minimum** | **3** | **1** | **2** |

Scored on the minimum, not the average — a direction is as good as its worst dimension.

## 4. Recommendation

**A — THE LEDGER**, taking the drawn cross-sections from C as the one illustrated moment.

Four reasons:

1. **It needs no photographs.** The farm has none and the room is not built yet. This is
   the only direction that is complete without assets rather than waiting on them.
2. **It is light.** The rejected build was dark with a gold accent — the exact default. A
   paper-white typographic site is the furthest available move from it, and B and C both
   walk back toward dark.
3. **It is honest for a business that has not opened.** A record that starts short and
   grows is truthful. A cinematic hero for an empty room is not.
4. **It is genuinely useful.** Nobody selling vegetables publishes what is actually in the
   room and what was done to it. That is a real differentiator, not a decorative one.

**What A deliberately does not combine:** no photography, no dark surfaces, no glow, no
glass, no cards, no gradient text, no hero image, no uniform section padding. If any of
those appear during the build, the build has drifted and the direction was not held.

---

## 5. Open blockers

- `PAUSE` — which crops are in the room. Drives the entire record. Nothing to fake here.
- `PAUSE` — year-round indoor only, or indoor plus an outdoor season later. Decides whether
  the frost-date logic in `src/lib/season.ts` is deleted or kept beside a second model.
- `ASK_WHILE_CONTINUING` — two or three reference sites the owner admires.
