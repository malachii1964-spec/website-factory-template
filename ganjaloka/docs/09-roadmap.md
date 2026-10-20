# 09 — Roadmap

Every phase ships only when its acceptance criteria pass **and** the repo
gates pass: `tsc --noEmit`, lint, `next build`, unit + DB tests, a browser
check including one failure case, a review pass, and the performance budgets.

## Phase 0 — Spec ✅
This `docs/` package.

## Phase 1 — Social core on the web (built in this repo)
**Acceptance criteria**
1. Logged-out visitors hit the 21+ gate before content. Legal pages stay reachable.
2. Sign-up with email, password, username, display name, birth date and terms
   acceptance. Under-21 is rejected (UI **and** database). The email confirmation
   link signs the member in.
3. Log in, log out, forgot password → reset via email.
4. Edit profile: display name, bio, avatar (metadata stripped). Profanity and
   sales filter on text fields.
5. Compose posts (≤500 characters, ≤4 photos with alt text), reply, repost,
   un-repost, like, unlike, and delete your own post.
6. Follow and unfollow. Profile pages show counts and posts.
7. Home feed (you + people you follow), Explore feed, thread pages, with
   keyset "load more".
8. Block (hides content both ways and cuts follows), report a post or profile,
   moderator queue with dismiss / remove / suspend. Suspended members can't write.
9. Settings → delete account (confirm by typing DELETE).
10. Legal drafts: Terms, Privacy, Community Guidelines, Contact.

## Phase 2 — Video (the YouTube pillar)
Mux direct uploads, webhook, `videos` table, watch page `/v/[id]`, clip feed
`/clips`, views, video moderation, **CSAM hash-matching vendor live before launch**.
See `07-video-pipeline.md`.
**Needs from the owner:** a Mux account and keys.

## Phase 3 — Engagement
- Notifications (likes, replies, follows, reposts, mentions): a `notifications`
  table filled by triggers, delivered live with Supabase Realtime.
- Mentions (`@name`) and hashtags (`#strain`) parsed at insert; hashtag pages.
- Search: Postgres full-text search over posts and profiles (GIN index).
- Trending hashtags (24 h window, materialized every 10 min with Vercel Cron).
- DMs, which need: block enforcement, a message-request inbox for non-followers,
  and reporting inside threads.
- A DMCA takedown form.

## Phase 4 — Native apps
Expo app (iOS + Android) on the same backend, `/api/v1` write routes, push
notifications, and store submission. See `08-mobile-app.md`.
**Needs from the owner:** an LLC, an Apple Developer account (organization),
and a Google Play developer account.

## Phase 5 — Growth (only after product-market signals)
Opt-in "For you" ranking experiment, creator profiles and verification, and
groups/communities (grow journals). Any monetization needs legal review first
(see `06` section 6).
