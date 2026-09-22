---
name: red-team
description: Full-site adversarial simulation. Find every way the site can fail, embarrass, harm, or deceive — security, claims, accessibility, performance, legal, UX, and operations — before a real adversary does. Use before major launches, after significant features land, or whenever something feels "too good to check." Returns a ranked vulnerability report and a Ship/Don't Ship verdict for the site as a whole.
---

# Red Team — Full-Site Adversarial Simulation

## Mission

The `challenger` skill reviews a feature. The `red-team` skill attacks the WHOLE SITE. Different scope, different mindset. You are not the builder. You are the hostile reviewer, the regulator, the malicious user, the journalist writing "Cannabis Site Exposes User Data," the competitor documenting your false claims, and the screen reader user who can't complete checkout.

Find what's embarrassing BEFORE it embarrasses the owner.

## Scope

Red team covers six attack domains simultaneously. Each gets its own pass.

---

## Domain 1 — Security

**Objective:** Find paths where a malicious user gains unauthorized access, data, or capabilities.

Check:
- Every server action/API route: is authorization checked server-side, not just client-side?
- Input validation: what happens with `<script>alert(1)</script>` in every text field?
- SQL/NoSQL injection: are all DB queries parameterized?
- CSRF: do state-mutating routes require CSRF tokens or SameSite cookies?
- Secrets: `git log -p | grep -iE 'sk-ant-|AKIA|ghp_|password|secret'` — anything in history?
- Auth bypass: can a signed-out user reach any member-only content by modifying the URL?
- Rate limiting: can a bot hammer the signup/login/contact form?
- File upload: if file uploads exist, is type and size validated server-side?
- Error messages: do errors expose stack traces or internal paths to users?
- Environment: are any secret values readable in client-side bundles?

Severity: Critical = data breach, auth bypass, secret exposed. High = injection, missing rate limit.

---

## Domain 2 — Claims and Truth

**Objective:** Find every claim that could not survive a journalist's fact-check or a regulator's review.

Check every page for:
- Invented statistics ("X% of customers report...")
- Unverified testimonials
- Before/after claims (health outcomes, yield, results)
- Partnership or affiliation claims ("as seen in", "partnered with")
- Compliance claims ("WCAG compliant", "HIPAA compliant") without audit evidence
- Price claims that aren't current and verified
- "Best," "most," "fastest," "#1" without sourced comparison
- Medical, legal, or financial claims without qualified disclaimer
- Cannabis-specific: any claim that implies medical efficacy without research citation
- Simulated data presented as real activity (fake user counts, live dashboards)

Truth Protocol check: every material claim must be labeled VERIFIED, USER_PROVIDED, INFERENCE, UNKNOWN, SIMULATED, or PROHIBITED. An unlabeled claim is UNVERIFIED and blocks ship.

Severity: Critical = medical/legal/financial claim without disclaimer. High = invented stat, fake testimonial.

---

## Domain 3 — Accessibility

**Objective:** Find paths where a user with a disability cannot complete a critical journey.

Run:
```bash
npx axe-cli [URL] --tags wcag2a,wcag2aa 2>&1 | tail -40
```

Then manually check:
- Tab through the entire primary journey without a mouse — does it complete?
- Every interactive element: does it have an accessible name?
- Every image: does it have alt text that conveys the same information?
- Color contrast: does any text fail 4.5:1 (normal) or 3:1 (large)?
- Focus: is focus ever trapped in a modal/drawer and can't escape?
- Motion: does the site respect `prefers-reduced-motion`?
- Mobile: are tap targets ≥ 44px? Does any element require hover to reveal critical info?
- Forms: are all inputs labeled? Are error messages associated with the field?

Severity: Critical = keyboard trap, form unusable without mouse. High = missing alt text on meaningful images, focus invisible.

---

## Domain 4 — Performance

**Objective:** Find where the site fails real users on real devices.

Check:
- Run Lighthouse mobile in incognito: `npx lighthouse [URL] --preset mobile --output json`
- LCP > 2.5s: what is the LCP element? Is it prioritized?
- CLS > 0.1: what causes layout shift? Images without dimensions? Dynamic content injected above fold?
- INP > 200ms: any interaction that blocks the main thread?
- JS bundle: `next build` output — any route over 150KB gzipped?
- Images: any unoptimized image over 100KB? Any image without explicit width/height?
- Fonts: is font-display set? Are fonts self-hosted or CDN?
- Third-party scripts: any script loaded synchronously in the head?
- Mobile: test on simulated Moto G4 or equivalent — NOT a developer laptop

Severity: Critical = LCP > 4s, INP > 500ms (unusable). High = LCP 2.5–4s, bundle > 250KB.

---

## Domain 5 — Legal and Compliance

**Objective:** Find regulatory exposure.

Check for:
- Age gate: is it present on entry to cannabis content? Is it bypassable by URL manipulation?
- Privacy policy: does the site collect any data (analytics, forms, accounts)? Is there a privacy policy?
- Cookie consent: if EU/UK traffic is possible, is there a consent mechanism?
- Cannabis advertising: does any language violate state advertising rules (price claims, potency claims, health claims)?
- DMCA/IP: are any images, fonts, or code assets used without license?
- Affiliate disclosure: are affiliate links disclosed with rel="nofollow sponsored" and text disclosure?
- Terms of service: does e-commerce require terms?
- Shipping restrictions: does the shop ship only to legal jurisdictions?
- Age verification at checkout: is age re-verified at point of sale?

Severity: Critical = missing age gate, health claim that implies treatment. High = missing affiliate disclosure, undisclosed data collection.

---

## Domain 6 — Operations and Recovery

**Objective:** Find what breaks when things go wrong.

Check:
- What happens when the database is unreachable? Does the site 500 or degrade gracefully?
- What happens when a third-party API (Resend, Stripe, etc.) is down?
- Is there a rollback plan for the current deployment?
- Are database migrations reversible?
- Are backups configured? When was the last backup tested?
- Are error rates monitored? Is there an alert if the site goes down?
- Are there any environment variables not in `.env.example`?
- Is there a single point of failure (one API key, one service) with no fallback?

Severity: Critical = no rollback, no backup, secrets not documented. High = no monitoring, no graceful degradation.

---

## Output format

```
RED TEAM REPORT
Site: [name and URL]
Date: [date]
Scope: [what was covered, what was out of scope]

DOMAIN SCORES (1–10, lower = more vulnerable)
Security:         [score] — [top finding in one sentence]
Claims/Truth:     [score] — [top finding in one sentence]
Accessibility:    [score] — [top finding in one sentence]
Performance:      [score] — [top finding in one sentence]
Legal/Compliance: [score] — [top finding in one sentence]
Operations:       [score] — [top finding in one sentence]

SITE FLOOR SCORE: [lowest domain score] / 10

CRITICAL VULNERABILITIES (must fix before next launch)
1. [Finding — domain — severity — exact file:line if applicable]
...

HIGH FINDINGS (fix before next launch; exception requires risk owner)
1. [Finding]
...

MEDIUM FINDINGS (track in Known Issues)
1. [Finding]
...

SITE VERDICT: SHIP | DON'T SHIP | CONDITIONAL
CONDITION (if CONDITIONAL): [the specific fix that would change the verdict]

NEXT RED TEAM: [recommended date or trigger for next full red team]
```

## Frequency

- Before any major public launch or marketing push
- After any feature that changes auth, payments, data, or forms
- After any significant content update (new claims, new pages)
- Quarterly for sites with active users
- Whenever something feels "good enough without checking"

## What red team does NOT do

- Does not build fixes. Report only. Builder implements.
- Does not re-examine decisions already logged in CLAUDE.md unless they create an active vulnerability.
- Does not substitute for a professional security audit for high-stakes systems. If financial data, medical data, or identity verification is involved, require a human penetration test.
