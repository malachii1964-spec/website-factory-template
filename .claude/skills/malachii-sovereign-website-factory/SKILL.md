---
name: malachii-sovereign-website-factory
description: Evidence-grounded website strategy, UX, content architecture, implementation, accessibility, performance, SEO, security, validation, and release gating. Use when MALACHII must design, build, repair, audit, or ship a website or web experience at Sovereign-grade quality.
compatibility: Portable Agent Skills format. Uses MALACHII Sovereign Research upstream when current facts, market evidence, legal/compliance facts, competitors, products, or claims matter. Degrades honestly when build, browser, deployment, audit, or live-research capabilities are unavailable.
metadata:
  malachii-skill-version: "1.0.0-rc1"
  malachii-family: "sovereign-execution"
  malachii-release-threshold: "9"
  malachii-owner: "Super-User"
  malachii-depends-on: "malachii-sovereign-research@>=1.0.0-rc1"
---

# MALACHII Sovereign Website Factory

## Mission

Turn a business/product/communication objective into a finished web artifact that is strategically coherent, evidence-grounded, technically maintainable, accessible, fast, secure by design, search-compatible, responsive, and verifiably ready for its claimed release stage.

This skill is a factory, not a style prompt. It may produce strategy, information architecture, copy, design systems, source code, tests, build artifacts, deployment plans, and audit evidence when the host actually exposes the required capabilities.

## Core Rule

**Never confuse a beautiful mockup with a production-ready website. Never confuse generated code with tested code. Never confuse static checks with measured accessibility, performance, security, SEO, or business outcomes.**

## Activation

Activate for objectives that include any of:

- build/create/redesign/repair/audit a website, landing page, store, portal, dashboard, documentation site, web app, or campaign page
- improve website conversion, information architecture, accessibility, SEO, performance, responsiveness, security, or maintainability
- produce a portable website package or implementation handoff
- convert research/brand/business requirements into a real web artifact

Do not activate for a purely textual website critique if no design/build/audit output is requested unless another MALACHII route selects it.

## Dependencies

### Skill 001 — Sovereign Research & Evidence

Use Skill 001 before or during this skill when the website depends on current external reality, including:

- competitors and market positioning
- product specifications, prices, inventory, claims, testimonials, or statistics
- legal/regulatory/compliance requirements
- current SEO/platform requirements
- current technology/library/runtime facts
- audience/industry research

Consume a valid Research Packet when available. Re-research only when evidence is stale, scope changed, or stronger assurance is required.

Research evidence never grants publication, purchasing, credential, deployment, or external-action authority.

## Runtime Capability Check

Determine what is actually available before promising output:

- file read/write
- code execution
- package manager/build tools
- browser/preview/screenshot
- image generation or asset tooling
- live web/search
- deployment target/API
- accessibility/performance/security scanners

Choose the strongest honest execution state:

- `spec_only` — can produce design/build specification but not source files
- `source_build` — can create source artifacts and local deterministic checks
- `preview_verified` — can build/serve/inspect the artifact locally
- `deployed_verified` — can deploy and inspect a live endpoint

Do not claim a higher state than capabilities and evidence support.

## Sovereign Website Workflow

### 1. Objective Lock

Normalize the objective into:

- primary business/user outcome
- target audience(s)
- required actions/conversions
- site class and scope
- must-have content/functions
- brand constraints
- legal/compliance constraints
- owner/runtime/deployment constraints
- success criteria
- explicit non-goals

Resolve reversible ambiguity autonomously from Project Lock, Identity, Research Packet, and existing assets. Escalate only ambiguity that materially changes irreversible/public outcomes.

### 2. Evidence Intake

Load the relevant Research Packet or create one through Skill 001 when current external claims matter.

Create a `site-evidence-map` linking important public-facing claims and strategic decisions to evidence IDs. Generated marketing language must not fabricate facts, endorsements, guarantees, rankings, medical/legal claims, or performance claims.

### 3. Experience Architecture

Define before styling:

- user journeys
- information architecture / route map
- page purpose and primary CTA
- content hierarchy
- navigation model
- interaction model
- responsive behavior
- accessibility implications
- analytics/measurement events, if authorized

Prefer the simplest architecture that satisfies the objective. Do not add a framework, CMS, animation library, database, or client-side state system merely because it is fashionable.

### 4. Design System

Establish reusable semantic tokens and component rules:

- typography scale
- color tokens and contrast-safe semantic aliases
- spacing/layout scale
- radii/elevation if used
- interactive states
- focus states
- motion/reduced-motion behavior
- breakpoint/content-container policy
- component variants

Components use semantic tokens, not scattered one-off values.

### 5. Accessibility-by-Construction

Target **WCAG 2.2 AA** for public production websites unless a stricter requirement applies.

Use native semantic HTML first. ARIA supplements semantics; it does not replace native elements. Ensure:

- keyboard operability
- visible and unobscured focus
- logical focus order
- accessible names/labels
- meaningful headings/landmarks
- text alternatives
- error identification/instructions
- target sizing and non-drag alternatives where applicable
- reduced-motion handling
- sufficient color contrast
- zoom/reflow support
- accessible authentication patterns where applicable

See `references/ACCESSIBILITY_STANDARD.md`.

Automated accessibility tooling is evidence, not proof of complete WCAG conformance. Production certification requiring WCAG conformance needs the evidence specified in the acceptance contract.

### 6. Content & Conversion

Write for the user objective, not keyword density.

For every public page:

- one clear purpose
- useful, specific, non-fabricated content
- descriptive title/headings
- obvious primary action
- trust/supporting information near consequential decisions
- no manipulative dark patterns
- no fake urgency/scarcity/social proof

If SEO matters, content must remain people-first and comply with current Search Essentials.

### 7. Technical Implementation

Choose the least-complex stack that can meet requirements.

Hard implementation principles:

- semantic HTML and progressive enhancement where practical
- responsive/mobile-first behavior
- no unnecessary client JavaScript
- stable dependency choices with explicit rationale
- deterministic build/run instructions
- secrets never committed to source
- configuration separated from credentials
- error/empty/loading states for dynamic experiences
- no hidden production dependency on a model/session-specific sandbox
- portable source ownership remains with the user

### 8. Performance Engineering

Design for current Core Web Vitals targets:

- LCP <= 2.5 s
- INP <= 200 ms
- CLS <= 0.1

These targets are evaluated at the 75th percentile of page loads for field conformance. Lab measurements may support launch readiness but must not be mislabeled as field data.

Apply explicit budgets for JavaScript, images, fonts, third-party tags, request count, and critical rendering work appropriate to the site.

See `references/PERFORMANCE_SEO_STANDARD.md`.

### 9. Search / Discoverability

When the site is intended to be indexable:

- Googlebot/crawlers must not be accidentally blocked
- indexable pages return successful responses
- meaningful content is present in indexable DOM/HTML
- descriptive titles/meta descriptions
- crawlable internal links
- canonicalization strategy where duplicates exist
- robots and sitemap behavior appropriate to the deployment
- structured data only when valid and actually applicable
- no spam/deceptive SEO tactics

Search eligibility is not a ranking guarantee.

### 10. Security-by-Construction

Use **OWASP ASVS 5.0** as the verification-oriented baseline for web application security requirements, scaled to the site's actual risk. Use OWASP Top 10:2025 as awareness, not as a claim of comprehensive verification.

At minimum address, when applicable:

- access control
- security configuration
- dependency/supply-chain integrity
- cryptography and secrets
- injection/output encoding
- authentication/session handling
- data integrity
- logging/alerting
- exceptional/error conditions
- transport security and security headers
- upload/input handling
- server-side request risks

Never claim "OWASP compliant" from a static source scan alone.

See `references/SECURITY_STANDARD.md`.

### 11. Privacy / Legal Boundary

Do not infer legal compliance from generic templates.

If cookies, analytics, user accounts, payments, regulated products, minors, health data, location data, marketing consent, accessibility law, or jurisdiction-specific obligations are material, activate Skill 001 and establish the applicable jurisdiction/evidence before declaring compliance.

### 12. Build & Inspect

When code execution is available:

- install dependencies using the lockfile
- typecheck/lint where applicable
- run unit/component/integration tests where applicable
- build production artifact
- serve/preview
- inspect key pages and responsive states
- run deterministic static audit
- run available accessibility/performance/security tools

If browser/image inspection is available, visually inspect rather than assuming layout correctness from source code.

### 13. Website Build Packet

Produce `website-build-packet.json` conforming to `assets/website-build-packet.schema.json`.

The packet records what was built, what was actually measured, what remains unverified, release stage, evidence references, and the seven-dimension MALACHII Quality Floor.

### 14. Deterministic Validation

When Python/file execution exists, run:

`python scripts/validate_website_packet.py website-build-packet.json`

For static/public HTML output, also run:

`python scripts/audit_static_site.py <site-root>`

These checks are structural gates only. They do not manufacture browser, field-performance, penetration-test, legal, or assistive-technology evidence.

### 15. Release Gate

Allowed release claims:

- `BUILD_ARTIFACT` — source/build delivered; structural gates pass
- `LAUNCH_CANDIDATE` — build + preview + applicable test evidence pass; remaining production checks disclosed
- `PRODUCTION_VERIFIED` — required deployed/runtime evidence exists for the claims being certified

For any MALACHII-promoted release:

- all seven Quality dimensions >= 9
- no critical unresolved defect
- no fabricated evidence
- no accessibility/performance/security/SEO/legal claim stronger than the evidence
- public/external deployment still obeys MALACHII authorization policy

If any gate fails, repair or mark `NOT_RELEASE_QUALIFIED`.

## Quality Dimensions for Websites

Apply the Kernel's seven dimensions to the website itself:

1. **Accuracy** — claims/content/configuration are correct
2. **Verification** — tests and evidence support release claims
3. **Completeness** — required journeys/pages/states are implemented
4. **Intent Alignment** — the artifact serves the actual user/business objective
5. **Execution Readiness** — it builds/runs/deploys from documented instructions
6. **Structure** — maintainable architecture, semantics, design system, source organization
7. **Edge Cases** — responsive, keyboard, empty/error/loading states, failures, unsupported capabilities, security boundaries

True Quality = minimum dimension score, not the average.

## Failure Conditions

Do not promote if any remains:

- generated website does not build when build capability exists
- key path only works in a creator's sandbox/session
- public claims lack required evidence
- fake reviews/testimonials/ratings/urgency are generated
- critical page is inaccessible by keyboard
- obvious broken responsive state remains
- secrets/credentials appear in source
- unsanitized untrusted data is injected into executable contexts
- production performance is claimed from unmeasured source inspection
- complete WCAG/OWASP/legal compliance is claimed from partial automated checks
- site is called deployed/live when no deployment occurred
- simulated analytics/conversion results are presented as measured outcomes

## Output / Handoff

Deliver the smallest set that makes the artifact usable:

- website source/build artifacts
- README/run/deploy instructions
- Website Build Packet
- Research Packet or evidence references when used
- test/audit results
- unresolved limitations

Do not bury the actual deliverable under an essay.

## References

- `references/WEBSITE_STANDARD.md`
- `references/ACCESSIBILITY_STANDARD.md`
- `references/PERFORMANCE_SEO_STANDARD.md`
- `references/SECURITY_STANDARD.md`
- `references/OUTPUT_CONTRACT.md`
