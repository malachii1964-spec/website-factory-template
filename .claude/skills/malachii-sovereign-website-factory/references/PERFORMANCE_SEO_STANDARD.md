# Performance & Search Standard

## Core Web Vitals

Primary source: https://web.dev/articles/vitals

Current targets:
- Largest Contentful Paint (LCP): <= 2.5 seconds
- Interaction to Next Paint (INP): <= 200 milliseconds
- Cumulative Layout Shift (CLS): <= 0.1

Field conformance is evaluated at the 75th percentile, segmented across mobile and desktop. Lab data is useful for launch engineering but must not be presented as field data.

## Performance engineering principles

- Minimize unnecessary client-side JavaScript.
- Explicitly size media to prevent layout shifts.
- Optimize images and responsive sources.
- Avoid render-blocking third-party dependencies where possible.
- Load fonts deliberately; avoid excessive families/weights.
- Lazy-load below-the-fold media where appropriate, not the likely LCP asset.
- Budget third-party tags.
- Cache immutable static assets appropriately.
- Measure actual rendered experience when browser tooling exists.

## Google Search Essentials

Primary source: https://developers.google.com/search/docs/essentials

For indexable public pages:
- crawler access is intentional
- successful HTTP response
- indexable content exists
- helpful/reliable/people-first content
- descriptive titles/headings and meaningful alt/link text
- crawlable links
- technically valid handling of images/video/structured data/JavaScript as applicable

Developer guidance: https://developers.google.com/search/docs/fundamentals/get-started-developers

Search eligibility is not a ranking guarantee. Never promise first-page/number-one rankings.
