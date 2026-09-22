---
name: launch-sequence
description: Complete go-live protocol for the MALACHII Website Factory stack — Next.js + Vercel + Neon + Cloudflare + Resend. Walk every step in order. Nothing goes live until every gate clears. Use before any production launch or domain cutover.
---

# Launch Sequence — Website Factory Go-Live Protocol

## Stack
Next.js App Router · Vercel (hosting) · Neon (Postgres) · Better Auth (sessions) · Resend (email) · Cloudflare (DNS + CDN) · GitHub (source)

## Iron Law

**Preview is never production.** Every step must pass in preview before touching production. No exceptions.

---

## Phase 1 — Pre-Flight (do before touching anything)

### 1.1 Gate check
Run `factory-gates` skill — all gates must pass before launch prep begins.

```bash
npx tsc --noEmit
npm run lint
npm test -- --run
npm run build
```

All four green. If anything fails, stop here.

### 1.2 Secrets audit

```bash
# Confirm nothing sensitive is committed
git log -p | grep -iE 'sk-ant-|sk-proj-|AKIA|ghp_|xoxb-|-----BEGIN.*PRIVATE KEY|neon\.tech.*password'
```

Empty output required. If a match exists: rotate the key immediately, do not proceed until done.

```bash
# Confirm .env.local is gitignored
cat .gitignore | grep env
```

Must show `.env*.local` or equivalent.

### 1.3 Environment variables — production checklist

Open Vercel → Project Settings → Environment Variables. Confirm each required variable is set for **Production** (not just Preview):

| Variable | Where to get it | Required for |
|---|---|---|
| `DATABASE_URL` | Neon console → Connection string | Database |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | Auth sessions |
| `BETTER_AUTH_URL` | `https://yourdomain.com` | Auth CORS |
| `RESEND_API_KEY` | Resend dashboard | Email |
| `ANTHROPIC_API_KEY` | Anthropic console | AI features |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Metadata, OG |

Add any project-specific variables from `.env.example`.

**Never paste secret values here or in chat.** Confirm names only.

### 1.4 Database — production state

```bash
# Run migrations against production
npx drizzle-kit push
```

Or if using migrate:
```bash
npx drizzle-kit migrate
```

Confirm: tables exist, no migration errors, seed data (if any) is in place.

---

## Phase 2 — Preview Verification (Vercel preview URL)

### 2.1 Deploy to preview

```bash
git push origin [branch]
```

Wait for Vercel preview deployment. Note the preview URL.

### 2.2 Critical path walk (do in a private/incognito browser)

Walk every critical user journey on the preview URL:

- [ ] Homepage loads — LCP element visible within 3s on throttled mobile
- [ ] Navigation works — all links resolve, no 404s
- [ ] Auth: signup → verify → login → logout → forgot password (if implemented)
- [ ] Primary CTA works end-to-end
- [ ] Contact/intake form sends (check the actual inbox, not just "success" toast)
- [ ] If shop exists: add to cart → checkout → order confirmation
- [ ] Member-only content: signed-out user cannot access, signed-in user can
- [ ] Age gate: appears on first visit, persists correctly
- [ ] Mobile layout at 375px: no horizontal scroll, tap targets reachable
- [ ] Reduced motion: set `prefers-reduced-motion: reduce` in OS, reload — animations stop

### 2.3 Performance check (preview URL)

```bash
npx lighthouse [PREVIEW_URL] --preset mobile --output html --output-path ./lighthouse-preview.html
```

Targets: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms. Flag anything over budget before promoting.

### 2.4 Security headers check

```bash
curl -I https://[PREVIEW_URL] 2>&1 | grep -i "x-content-type\|x-frame\|strict-transport\|content-security"
```

Expect: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` or `SAMEORIGIN`, `Strict-Transport-Security`.

---

## Phase 3 — Domain Cutover (Cloudflare + Vercel)

**Do this in order. Each step gates the next. Do not skip ahead.**

### 3.1 Add domain to Vercel

Vercel → Project → Domains → Add Domain → enter `yourdomain.com` and `www.yourdomain.com`.

Vercel will show DNS instructions. Note the values — you'll need them in step 3.3.

### 3.2 Audit existing DNS (if domain was previously pointed elsewhere)

**Critical:** Before writing a single record, audit and DELETE all inherited/old records:

```
# In Cloudflare DNS: check for and remove old records that would conflict:
# - Old A/AAAA records pointing to previous host
# - Old CNAME records for www
# - Old MX records if you're NOT keeping email from this domain
# - Old SPF/DKIM/DMARC from the previous email setup (will break your new email)
```

A foreign DMARC, SPF, or MX record from a previous owner will silently intercept or reject your email. Remove before adding anything new.

### 3.3 Write DNS records (Cloudflare)

Add exactly what Vercel instructs. Standard config:

```
Type    Name    Content                 Proxy
A       @       76.76.21.21             Proxied (orange cloud ON)
CNAME   www     cname.vercel-dns.com    Proxied (orange cloud ON)
```

Wait for DNS propagation: `watch -n 5 'dig yourdomain.com A +short'`

### 3.4 Verify domain resolves to Vercel

```bash
curl -sI https://yourdomain.com | head -5
# Expect: HTTP/2 200 (or 301 to www)
# Server header should show Vercel or Cloudflare
```

### 3.5 SSL/TLS

Vercel auto-provisions certificates. Verify in Vercel → Project → Domains → both domains show green checkmark.

Cloudflare TLS mode: **Full (Strict)** — NOT Flexible. Flexible breaks Vercel.

### 3.6 Configure email (Resend + Cloudflare)

In Cloudflare DNS, add Resend's DNS records (from Resend dashboard → Domains):

```
Type    Name                    Content
TXT     @                       v=spf1 include:_spf.resend.com ~all
CNAME   resend._domainkey       [value from Resend]
```

Add DMARC **last** — only after SPF and DKIM are verified passing:

```
Type    Name    Content
TXT     _dmarc  v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

Send a test email via Resend → confirm it arrives and passes SPF/DKIM.

---

## Phase 4 — Production Smoke Test

After domain resolves and SSL is green:

### 4.1 Live site check (private browser, real domain)

- [ ] `https://yourdomain.com` loads — no certificate errors
- [ ] `http://yourdomain.com` redirects to HTTPS
- [ ] `www.yourdomain.com` resolves correctly
- [ ] Homepage is not the Vercel default or a cached old version
- [ ] Auth signup works on the live domain (BETTER_AUTH_URL must match)
- [ ] Any transactional email works (test signup → check inbox for welcome email)

### 4.2 Performance on live URL

Run Lighthouse again on the live URL. CDN edge caching should improve numbers vs. preview.

### 4.3 Analytics confirmation

If Vercel Analytics is installed: `https://vercel.com/[org]/[project]/analytics` — confirm pageviews are flowing.

---

## Phase 5 — Go/No-Go Decision

Complete the `RELEASE_GATE.md` template in `.claude/skills/factory-gates/RELEASE_GATE.md`.

Every row must have evidence. Blank rows block launch.

**Go criteria:**
- All Phase 1–4 checks complete with evidence
- RELEASE_GATE.md shows GO
- No open Critical or High findings from `red-team` or `challenger`
- Owner has A3 authorization on record

---

## Phase 6 — Post-Launch (first 24 hours)

- [ ] Monitor Vercel error logs: `vercel logs [project] --follow`
- [ ] Check Neon query inspector for unexpected slow queries
- [ ] Confirm form submissions are arriving (check email/Resend logs)
- [ ] Confirm no 404 spikes in analytics
- [ ] Check Google Search Console for any crawl errors (if indexed)
- [ ] 24 hours post-launch: run Lighthouse again for baseline

---

## Rollback procedure

If anything breaks after go-live:

1. **Rollback Vercel deployment** — Vercel → Deployments → previous deploy → Promote to Production
2. **DNS rollback** — only if domain was previously working elsewhere and you have the old records saved
3. **Database rollback** — only if migrations ran; restore from Neon backup
4. **Debug in preview**, not in production. Never diagnose on a broken live site.

---

## Stage claim after completion

`PRODUCTION_VERIFIED` — only after Phase 4.1 passes with a real visitor opening the live URL in a private browser and critical paths working.
