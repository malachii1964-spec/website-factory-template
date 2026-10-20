# 01 — Product Spec

## One line
**GANJALOKA** (*ganja* + Sanskrit *loka*, "world, realm") is the 21+ social world
for cannabis culture: identity and community like Facebook, fast posts and
conversation like Twitter/X, and video like YouTube. Web first, then native
iOS and Android apps on the same backend.

## Who it's for
Adults 21+ who live cannabis culture:

| Persona | What they come for |
|---|---|
| Home grower | Show the grow, get diagnosis help, follow other growers' runs |
| Connoisseur | Talk strains, terpenes, sessions, gear; find their people |
| Creator / educator | Build an audience with posts and (phase 2) video |
| Culture fan | Art, music, news, humor around the plant |

**Not for:** buying or selling cannabis. No storefronts, menus, prices, or
delivery. This keeps GANJALOKA legal in more places and keeps it allowed in the
App Store and Google Play (see `06-trust-safety-compliance.md`).

## The three things a member must be able to do (Phase 1 scope — nothing else)
1. **Join**: pass the 21+ check, create an account, and set up a profile
   (username, name, bio, avatar).
2. **Post**: write a post (up to 500 characters, up to 4 photos), reply, like,
   and repost.
3. **Follow and read**: follow people, read a home feed of the people you follow,
   explore everyone's posts, and open any profile or thread.

Required in every phase, never optional:
- **Safety**: report posts and profiles, block people, filter for prohibited
  content (sales, slurs), a moderator queue, suspensions, and account deletion.
- **Privacy**: GPS and EXIF metadata are stripped from every photo before upload.
  A grower's photo must never reveal where the grow is.

## How the three platforms map onto GANJALOKA
| Borrowed from | GANJALOKA feature | Phase |
|---|---|---|
| Facebook — identity and graph | Profiles, follow graph, block graph, community rules | 1 |
| Twitter/X — speed and conversation | 500-char posts, replies (threads), reposts, likes, home timeline, explore | 1 |
| YouTube — media pipeline | Video upload, transcoding, adaptive streaming, view counts | 2 |
| All three | Notifications, search, hashtags, trending, DMs | 3 |
| All three | Native iOS and Android apps | 4 |

## Product principles
1. **Chronological first.** The home feed shows the people you follow, newest
   first. No engagement-bait ranking in v1. Ranking is a later, opt-in experiment.
2. **Grown-up by default.** 21+ only. No sales. Clear rules, quick moderation.
3. **Privacy is a feature.** Minimal data collected, metadata stripped, and
   one-tap account deletion.
4. **Fast on bad phones.** Every page meets `performance.md` budgets.
5. **Boring infrastructure.** Managed services, one database, no microservices
   until a metric demands them (see `02-architecture.md` → Scale path).

## Out of scope for v1 (explicitly)
Buying or selling of any kind, payments, ads, algorithmic ranking, livestreaming,
groups and pages, DMs (phase 3, because DMs need extra safety tooling), and
strain or dispensary directories.

## Success metrics
| Metric | Target at launch |
|---|---|
| p95 home-feed server time | < 300 ms |
| Report first response (moderator action) | < 24 h |
| Week-1 retention of new members | ≥ 25% |
| Posts per daily active member | ≥ 1 |
| Crash-free sessions (mobile, phase 4) | ≥ 99.5% |
