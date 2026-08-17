# MALACHII Website Standard

## Purpose

A website is release-qualified only when the strength of the release claim matches the evidence. Visual polish is never a substitute for semantic correctness, build reproducibility, accessibility, performance, security, or objective alignment.

## Required artifact layers

1. Objective and success criteria
2. Evidence/Research Packet when external reality matters
3. Information architecture and user journeys
4. Semantic design system
5. Source implementation
6. Deterministic build/test instructions
7. Audit evidence
8. Website Build Packet

## Current external standards baseline (reviewed 2026-08-15)

- WCAG 2.2: W3C Recommendation, target AA for ordinary public releases unless stricter requirements apply.
- Core Web Vitals: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, evaluated at the 75th percentile for field conformance.
- Google Search Essentials: technical eligibility + people-first/content/search best practices; compliance does not guarantee indexing/ranking.
- OWASP ASVS 5.0.0: verification-oriented web application security baseline. OWASP Top 10:2025 is awareness, not comprehensive certification.

Primary references:
- https://www.w3.org/TR/WCAG22/
- https://web.dev/articles/vitals
- https://developers.google.com/search/docs/essentials
- https://owasp.org/www-project-application-security-verification-standard/
- https://owasp.org/Top10/

## Evidence-strength ladder

- `DESIGNED`: requirement present in design/source
- `STRUCTURALLY_CHECKED`: deterministic source/static gate passed
- `LAB_MEASURED`: browser/tool measurement in a controlled environment
- `DEPLOYED_MEASURED`: measurement against deployed endpoint
- `FIELD_MEASURED`: real-user field evidence where applicable
- `INDEPENDENTLY_VERIFIED`: separate qualified verification context

Never translate a lower rung into a higher-rung claim.
