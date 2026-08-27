# Accessibility Standard

Target: WCAG 2.2 AA for public production websites unless law/contract/objective requires a stronger target.

Primary source: https://www.w3.org/TR/WCAG22/

## Build-time requirements

- Native semantic HTML first.
- Every interactive element keyboard operable.
- Visible focus; focused item must not be obscured by sticky/fixed UI.
- Logical DOM/focus order.
- One meaningful page language declaration.
- Landmark structure (`header`, `nav`, `main`, `footer`) where applicable.
- Heading hierarchy reflects content, not visual size.
- Images have context-appropriate text alternatives; decorative images use empty alt where appropriate.
- Form controls have programmatic labels and useful errors/instructions.
- Do not disable zoom or prevent reflow.
- Respect `prefers-reduced-motion` for non-essential motion.
- Target sizes and dragging alternatives meet applicable WCAG 2.2 criteria.
- Authentication must not impose unnecessary cognitive-function tests where applicable.

## ARIA rule

Prefer native elements. ARIA does not add keyboard behavior by itself. Complex widgets should follow applicable WAI-ARIA Authoring Practices patterns and keyboard interactions.

Useful primary guidance:
- https://www.w3.org/WAI/ARIA/apg/
- https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/

## Certification boundary

Automated tools catch only a subset of accessibility defects. A static audit may establish structural readiness, not complete WCAG conformance. `PRODUCTION_VERIFIED` accessibility claims require evidence appropriate to the site's complexity, including keyboard/manual review and, when material, assistive-technology testing.
