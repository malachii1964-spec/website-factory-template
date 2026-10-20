# 06 — Trust, Safety & Compliance

> **Not legal advice.** This is an engineering checklist built from primary
> sources, current as of 2026-10-19. Have a lawyer who knows cannabis law and
> platform liability review the Terms, Privacy Policy and Community Guidelines
> before launch. Items marked **VERIFY** need a current check.

## 1. App store rules that shape the product
### Apple App Store Review Guidelines (fetched 2026-10-19)
- **1.2 User-Generated Content.** Apps must include: "A method for filtering
  objectionable material from being posted to the app", "A mechanism to report
  offensive content and timely responses to concerns", "The ability to block
  abusive users from the service", and "Published contact information so users
  can easily reach you."
- **1.4.3.** "Apps that encourage consumption of tobacco and vape products,
  illegal drugs, or excessive amounts of alcohol are not permitted. Apps that
  encourage minors to consume any of these substances will be rejected.
  Facilitating the sale of controlled substances (except for licensed pharmacies
  and licensed or otherwise legal cannabis dispensaries), or tobacco is not allowed."
- **5.1.1(ix).** Apps in "legal cannabis use" should be "submitted by a legal
  entity that provides the services, and not by an individual developer", and
  apps that facilitate legal sale "must be geo-restricted".
  → **Submit the iOS app under a registered business (LLC) Apple Developer
  account, not a personal one.**
- **5.1.1(v).** "If your app supports account creation, you must also offer
  account deletion within the app."
- **2.3.6.** Answer the age-rating questions honestly. Expect the top age rating.

### Google Play (policy text not directly reachable from this environment; **VERIFY** in the Play Console Policy Center)
- **Marijuana policy** (as reported since 2019): "We don't allow apps that
  facilitate the sale of marijuana or marijuana products, regardless of
  legality." Examples: an in-app cart, arranging delivery or pickup, or selling
  THC products.
- **User-Generated Content policy:** clear terms that members accept before
  posting, an in-app system for reporting, a way to block other members, and
  timely action on reports. Social apps need **both** reporting and blocking,
  and they must be easy to find.

### How GANJALOKA complies (built in phase 1)
| Requirement | Where it lives |
|---|---|
| No sales or delivery features | The product has no commerce. The **sales filter** (`src/lib/moderation`) blocks price, menu and delivery solicitation in posts, bios and names. The `sale` report reason routes to moderators |
| Filtering objectionable material | Server-side content filter (slurs and hate terms via the `obscenity` dataset, plus the sales patterns) on every post, bio and display name |
| Reporting | "Report" on every post and profile → `reports` table → `/mod` queue |
| Timely responses | Moderator queue with one-click actions. Target: first action within 24 h |
| Blocking | "Block" on every profile and post menu. Enforced in RLS, so blocked content disappears in both directions everywhere |
| Published contact info | `/contact` plus the footer (`NEXT_PUBLIC_CONTACT_EMAIL`) |
| Terms accepted before posting | Sign-up requires accepting the Terms and Community Guidelines. The version is recorded in `member_attestations` |
| Account deletion in-app | Settings → Delete account (deletes auth user, profile, posts, likes, follows and media) |
| Age | 21+ attestation with birth date at sign-up, enforced by a DB trigger, plus an age gate for logged-out visitors |

## 2. Age gating (21+)
- **Logged-out visitors** must confirm they're 21+ before any page except the
  legal pages. This is enforced in `proxy.ts` with a 30-day cookie.
- **Sign-up** collects a birth date. The **database** rejects anyone under 21
  (`GL_UNDER_21`), even if the browser is bypassed. The birth date is stored
  privately as evidence and is never shown or sent in tokens.
- This is **self-attestation**, which is standard for cannabis media but is not
  ID verification. If a state or app store later requires real age assurance,
  add an age-verification vendor at sign-up. **VERIFY** your target states'
  cannabis marketing rules (for example New York OCM marketing and advertising
  rules) for content and audience requirements.

## 3. Child safety (zero tolerance)
- **Legal duty (US):** under **18 U.S.C. § 2258A**, a provider that obtains
  actual knowledge of apparent child sexual abuse material (CSAM) must report it
  to NCMEC's CyberTipline. The **REPORT Act (Pub. L. 118-59, 2024)** extended
  required preservation of reported content to **1 year** and requires storing it
  in line with the NIST Cybersecurity Framework.
- **Before launch:** register GANJALOKA as an electronic service provider with
  NCMEC for CyberTipline reporting access (**VERIFY** the current process at
  missingkids.org).
- **Product:** the report reason `minor_safety` goes to the top of the queue.
  The moderator action "remove and suspend" takes the post down but keeps the
  `target_snapshot` and the media file (posts with open reports aren't purged).
  Moderators must not download or re-share the material, only report it.
- **Phase 2+:** proactive hash matching for uploads (for example Cloudflare's
  CSAM Scanning Tool if images are served through Cloudflare, or Microsoft
  PhotoDNA / Thorn Safer). Required before video launches.

## 4. Copyright (DMCA safe harbor)
- Designate a DMCA agent with the US Copyright Office (online directory, small
  fee, renew every 3 years; **VERIFY** the current fee). Publish the agent and the
  takedown process in the Terms.
- Use reason `other` with "copyright" in the details until a dedicated DMCA form
  ships (phase 3). Moderators remove infringing posts with `remove_post`.

## 5. Privacy
- **Data minimization:** email, password hash (Supabase Auth), birth date
  (private), and profile fields. No phone, no location, no contacts.
- **Photo metadata stripping:** every photo is re-encoded in the browser
  (canvas → WebP, max 2048 px) before upload, which drops EXIF, GPS and the
  camera serial. A grower's photo must not reveal where the grow is.
- **Deletion:** account deletion removes the auth user, which cascades to the
  profile, posts, likes, follows and blocks. Storage media is removed except
  items under an open report (kept as evidence until resolved).
- **Analytics:** Vercel Analytics (cookieless). No ad trackers. Ever.
- **Privacy Policy** must cover: what's collected, why, processors (Supabase,
  Vercel, Mux, Resend), retention, deletion, and contact. Add a CCPA/CPRA
  section if you hit the thresholds (**VERIFY**).

## 6. Payments (future)
Mainstream processors (Stripe, PayPal, Venmo, Cash App) restrict
cannabis-related transactions in their terms. GANJALOKA v1 takes no payments.
If creator subscriptions or merch come later, get legal review and use a
processor that explicitly allows the business model.

## 7. Moderation operating procedure (v1)
1. Open `/mod`. Reports are sorted oldest-first, with `minor_safety` pinned on top.
2. For each report, read the snapshot, open the live target, then pick an action:
   - **Dismiss**: doesn't break the rules.
   - **Remove post**: breaks the rules, first time.
   - **Suspend member**: repeat offenses, sales, harassment campaigns, or impersonation.
   - **Remove and suspend**: sales solicitation, hate, sexual content involving
     anyone who looks underage (then file the NCMEC report), or credible threats.
3. Every action resolves all open reports on the same target and records who and when.
4. Target: first action within **24 hours**. Track the backlog daily.

## 8. Pre-launch legal checklist (owner)
- [ ] Form an LLC (needed for the Apple developer account under 5.1.1(ix)).
- [ ] Terms of Service, Privacy Policy and Community Guidelines reviewed by counsel
      (drafts are in `/legal/*`).
- [ ] DMCA agent designated.
- [ ] NCMEC ESP registration.
- [ ] Contact email on your domain set in `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] At least one trained moderator besides yourself.
- [ ] Check the cannabis marketing rules for every state you advertise in.
