# Cloudflare caching for lakeeriecannabis.com

Baseline measured 6 Aug – 5 Sep: **50,010 requests, 10.63% cached, 452 MB
served, 5.7k unique visitors.** Roughly 45,000 requests reached the origin
that should have been served from the edge.

## Why the number is so low

Cloudflare's default cache only covers **static file extensions** — `.js`,
`.css`, images, fonts. It does **not cache HTML documents** on any plan unless
you explicitly tell it to. So even a perfectly static page still hits the
origin on every single request.

Making routes static (done in code) is necessary but not sufficient. Both
halves are needed:

| Half | Where | Status |
| --- | --- | --- |
| Routes must *be* static to be cacheable | Code | Done — `/guides` plus 107 guide pages |
| Cloudflare must actually cache the HTML | Dashboard | **This document** |

## What must never be cached

These are per-user or write paths. Caching any of them would serve one
member's data to another, so the bypass rule goes **first**.

```
/api/*          auth, plant doctor, medical intake
/account        member dashboard
/grows          member grow journals
/grows/*
/join  /login   auth forms
```

Guide pages for **members-only** guides are rendered per request and must not
be edge-cached either, because the response differs by session. They are
covered by the `Cache-Control: private` that Next sends for dynamically
rendered routes — provided the rule below **respects origin cache headers**
rather than overriding them.

---

## Rule 1 — Bypass cache for personalised paths

Cloudflare dashboard → **Caching → Cache Rules → Create rule**

- **Name:** `Bypass — personalised and API`
- **Placement:** first (must run before the cache rule)

**Expression (edit as custom expression):**

```
(starts_with(http.request.uri.path, "/api/")) or
(starts_with(http.request.uri.path, "/account")) or
(starts_with(http.request.uri.path, "/grows")) or
(http.request.uri.path in {"/join" "/login"})
```

**Then:** Cache eligibility → **Bypass cache**

---

## Rule 2 — Cache static HTML, honouring origin headers

- **Name:** `Cache static pages`
- **Placement:** after Rule 1

**Expression:**

```
(http.request.method eq "GET") and
not starts_with(http.request.uri.path, "/api/")
```

**Then:**

- Cache eligibility → **Eligible for cache**
- Edge TTL → **Use cache-control header if present, use default otherwise**
  - default: **1 hour** (`3600`)
- Browser TTL → **Respect origin**

The header setting is the important one. Next marks dynamically rendered
routes `private, no-store`, so honouring origin headers means the 46 gated
guides and every member page stay uncached **automatically**, even if a path
slips past Rule 1. Overriding TTL instead of respecting headers would defeat
that and is the main way this configuration goes wrong.

---

## Rule 3 — Long-cache immutable build assets

Next fingerprints everything under `/_next/static/`, so those files can be
cached effectively forever.

- **Name:** `Immutable build assets`
- **Expression:**

```
starts_with(http.request.uri.path, "/_next/static/")
```

- **Then:** Eligible for cache · Edge TTL **1 year** · Browser TTL **1 year**

Also worth including your own media:

```
starts_with(http.request.uri.path, "/promos/") or
http.request.uri.path in {"/lake-erie-hero.webp" "/lake-erie-emblem.webp" "/og-image.webp"}
```

---

## Verifying it worked

From any machine with network access:

```bash
# Should become HIT on the second request
curl -sSI https://lakeeriecannabis.com/guides | grep -i "cf-cache-status\|cache-control\|age"
curl -sSI https://lakeeriecannabis.com/guides | grep -i "cf-cache-status"

# A free guide — should also be HIT
curl -sSI https://lakeeriecannabis.com/guides/autoflower-complete-guide | grep -i "cf-cache-status"

# A gated guide — MUST be BYPASS or DYNAMIC, never HIT
curl -sSI https://lakeeriecannabis.com/guides/advanced-breeding-techniques | grep -i "cf-cache-status\|cache-control"

# Member paths — MUST be BYPASS
curl -sSI https://lakeeriecannabis.com/account | grep -i "cf-cache-status"
```

Reading `cf-cache-status`:

| Value | Meaning |
| --- | --- |
| `HIT` | Served from edge — what you want on public pages |
| `MISS` | Went to origin, now cached; the next request should HIT |
| `BYPASS` | Rule 1 matched, or origin said `no-store` — correct for member paths |
| `DYNAMIC` | Cloudflare declined to cache — expected before the rules exist |

**The one check that matters most:** a gated guide and `/account` must never
report `HIT`. If either does, remove Rule 2 immediately and re-check Rule 1's
placement — that would mean one visitor's page could be served to another.

## What to expect

Cache hit rate should move from ~10% toward 70–90% within a day or two as the
edge warms. The remaining misses will be first-visit traffic, member pages, and
the 46 gated guides — all correct.

## After a deploy

Cached HTML can briefly serve the previous build. Either purge (**Caching →
Configuration → Purge Everything**) after a deploy, or accept up to the
1-hour TTL. Purging on deploy is the cleaner habit.

## Bot settings, noted not recommended

The dashboard's "Block AI training bots" is currently set to *block only on
pages with ads*. Leave it unless you have a reason: blocking AI crawlers
outright also removes the site from AI-assisted search results, which for an
education-led site is a real traffic source. That is a business call, not a
performance one.
