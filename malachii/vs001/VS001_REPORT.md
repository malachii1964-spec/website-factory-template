# VS001 — MALACHII's First Governed Execution

**Date:** 2026-08-27 · **Objective:** Establish the verified quality baseline of the
live FutureDeskAI site under MALACHII governance, using only capabilities observed
on this host.

This is the first time MALACHII did real work. Every prior proof in the lineage was
a deterministic reference, a loopback demo, or a synthetic fixture. VS001 built and
served a real site, measured it with a real browser, and ran the whole thing through
the real control-plane primitives.

## Outcome

| | |
|---|---|
| Execution state | `preview_verified` (capped — nothing deployed) |
| Quality Floor | **6** (minimum of seven, not average — polish was 7.71) |
| Release decision | **HOLD** |
| Release stage | **`NOT_RELEASE_QUALIFIED`** |
| Ledger | 10 events, hash chain valid, checkpoint signature valid |
| Packet | **VALID** against the skill's own validator |

**The headline is that it refused to ship.** Governance is only real if it can say no
to its own operator, and it did: floor 6 against a threshold of 9, two hard gates
failed, no publish grant.

## What was actually run

1. **Capability probe by observation** — `node.execute`, `filesystem.write`,
   `browser.render`, `python.execute` each reached **A3_OBSERVED** by successful
   invocation. `model.anthropic` was recorded **A0_UNKNOWN** (key unset — presence of
   a key would have been a *declaration*, never an observation). `deploy.publish` was
   never attempted and is not authorized.
2. **Real build** — `next build`, 40 pages prerendered, served by `next start`.
3. **Real Chromium pass** — Chromium 141, 8 routes × 2 viewports (390×844 and
   1440×900), 18 page loads.
4. **Deterministic static audit** — the skill's own `audit_static_site.py` over
   rendered DOM snapshots: **PASS**, 0 errors across 8 pages.
5. **Governed run** — RC1.6.2's real `PersistentEventLedger`, `authorize()`, and
   `releaseDecision()`. Not reimplementations.

## Boundary closed

`browser.render` reached **A3_OBSERVED** on this host. RC1.6.2's own
`LIVE_CONTROL_FABRIC.md` lists *"Chromium execution in this host"* under **explicitly
not verified** — headless Chromium timed out in their build container. It runs here,
and VS001 proves it by using it. Capability truth is per-host and per-time; this is a
new observation, not an inherited claim.

## Measured findings (real defects on the live site)

Every one computed from `getBoundingClientRect` / `getComputedStyle` in a real
browser — arithmetic, not model judgement.

| ID | Severity | Standard | Finding |
|---|---|---|---|
| VS001-F1 | medium | WCAG 2.2 AA 2.5.8 Target Size | **14 distinct interactive elements below the 24×24px minimum** at 390px, across 18 page/viewport combinations. Includes the footer nav link set (~18px tall) and `#lead-email` at 300×20. |
| VS001-F2 | low | WCAG 2.2 A 2.4.1 Bypass Blocks | **No in-page skip link to `main` on 8 of 8** audited pages. |
| VS001-F3 | low | WCAG 2.2 A 1.3.1 Info & Relationships | **Heading level skip (h1 → h3)** on `/products`, both viewports. |

## Measured passes (the site is genuinely solid here)

- **No horizontal overflow** at either viewport on any route.
- **No overlapping interactive elements** anywhere (pairwise rect intersection,
  nesting excluded).
- **No text below its required contrast ratio** among sampled nodes — computed with
  the WCAG relative-luminance formula, not eyeballed.
- **Keyboard reachable with visible focus** on every probed route (first `Tab` lands
  on a visible, focus-styled control).
- **Exactly one `main`, ≥1 `h1`, zero images missing `alt`** on every probed page.
- **Static audit PASS**, 0 errors.

## Quality Floor — every dimension derived, none typed by hand

| Dimension | Score | Derived from |
|---|---:|---|
| Accuracy | 9 | 0 navigation errors, 0 unexpected non-2xx across 18 loads |
| Verification | **7** | **capped** — real browser + auditor ran, but lab-only, single-sample, no field data, no deployed endpoint, no AT testing |
| Completeness | **6** | 8 of ~16 routes; no dynamic/`/api`/`/checkout`, no auth states, 22 of 30 product pages unexercised |
| Intent Alignment | 9 | answered the objective actually posed |
| Execution Readiness | 9 | production build succeeded, 40 pages prerendered and served |
| Structure | 8 | one `main` + ≥1 `h1` everywhere; one heading skip |
| Edge Cases | **6** | no critical/high defects, but three real accessibility gaps measured |

**Floor = 6** (min), polish 7.71 (average, informational only). Dimensions lacking
evidence were **capped, not estimated** — that distinction is the whole point.

## The moment the governance caught me

VS001's first packet asserted `releaseStage: "BUILD_ARTIFACT"`. The skill's validator
rejected it:

```
require(min(vals) >= 9, "promoted release requires all seven quality dimensions >= 9")
```

Any stage above `NOT_RELEASE_QUALIFIED` demands all seven dimensions ≥ 9. The measured
floor was 6. I had written a shape I assumed rather than reading the contract, and a
deterministic Python gate caught the overclaim that a narrative would have carried
straight through.

The runner now **derives** release stage from the contract instead of asserting it.
That is logged as lesson **VS001-L1**.

## First authentic MEMF episode

`evidence/MEMF_EPISODE_001.json` is MALACHII's first *real* memory record — every
prior MEMF test used synthetic fixtures, which is precisely why CMA-001 found the
governance decorative: nothing real ever pressured it.

Written per the CMA-002R / SUAF-001 repairs:
- **`M0_OBSERVATION` at creation** — no caller-minted maturity.
- **`derivedIndependentSourceCount: 4`** — computed as
  `Set(sourceRefs[].sourceGroup).size` from four genuinely distinct observation
  channels (host probe, Chromium, static auditor, production build), **never** a
  caller-supplied integer. This is the exact bypass CMA-001 proved.
- **Evidence IDs carry SHA-256 hashes** and the record is anchored to the ledger root.
- **`authorityNote`**: the record informs; it grants nothing.

Three lessons captured, all `raisesAuthority: false`, `reversible: true`, each with a
regression check.

## Explicitly NOT verified

- **Field Core Web Vitals** — no CrUX/RUM p75 data. Load timings in the evidence file
  are single-sample lab wall-clock and are **not** Core Web Vitals.
- **Deployed behavior** — nothing deployed, no deployment authority granted.
- **WCAG 2.2 AA conformance** — automated measurement is evidence, not certification.
  No assistive-technology or human testing.
- **Security** — no OWASP ASVS verification, dependency audit, or penetration test.
- **SEO outcomes** — no crawler, index-coverage, or ranking evidence.
- **Coverage** — dynamic routes, authenticated states, and 22 of 30 product pages
  unexercised.
- **Credentialed model execution** — `ANTHROPIC_API_KEY` unset, so **no
  Direct/Collaborative/Sovereign council comparison ran.** That remains the blocking
  milestone in `PROJECT_LOCK.md` and needs a key.

## What VS001 proves, and what it does not

**Proves:** the governance stack is not decorative. It probed honestly, measured real
facts, derived a floor from evidence, refused a release, and caught an overclaim its
own operator made. Chromium works on this host. The skills execute against real work.

**Does not prove:** production fitness, conformance to any standard, multi-host
behavior, provider routing quality, or that a council beats a single model. None of
those were measured, and none are claimed.

## Reproduce

```bash
pnpm build && pnpm start --port 3200 &
PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium \
  node malachii/vs001/scripts/probe_capabilities.mjs > malachii/vs001/evidence/RUNTIME_MANIFEST.json
PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium VS001_BASE=http://127.0.0.1:3200 \
  VS001_OUT=malachii/vs001/evidence/CHROMIUM_EVIDENCE.json \
  node malachii/vs001/scripts/chromium_evidence.mjs
PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium node malachii/vs001/scripts/snapshot_rendered.mjs
python3 malachii/skills/malachii-sovereign-website-factory/scripts/audit_static_site.py /tmp/vs001-site \
  > malachii/vs001/evidence/STATIC_AUDIT.json
node malachii/vs001/scripts/governed_slice.mjs
python3 malachii/skills/malachii-sovereign-website-factory/scripts/validate_website_packet.py \
  malachii/vs001/evidence/website-build-packet.json
```

## Next

1. **Fix VS001-F1/F2/F3** — three concrete, measured accessibility defects with a
   regression check already written (`tapTargetsUnder24px == 0`).
2. **Widen coverage** — probing the remaining routes lifts `completeness` (6), the
   dimension currently holding the floor down alongside `edgeCases`.
3. **Track B** — supply `ANTHROPIC_API_KEY` and run the A/B/C council evaluation.
   That is the milestone `PROJECT_LOCK.md` has named since RC1 and the only thing
   blocking it is a credential.
