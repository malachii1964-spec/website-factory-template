# 05 — Screens & Flows (Phase 1 web)

## Route map
| Route | Who | Purpose | Key states |
|---|---|---|---|
| `/age` | Everyone without the age cookie | "Are you 21 or older?" Yes → continue. No → leave (link to a neutral page) | — |
| `/` | Logged out | What GANJALOKA is, rules in brief, Join / Log in, a peek at Explore | Logged-in members redirect to `/home` |
| `/signup` | Logged out | Account + 21+ birth date + terms | Field errors, username taken, under 21 |
| `/check-email` | After sign-up | "Check your inbox" + resend hint | — |
| `/login` | Logged out | Email + password, link to reset | Wrong credentials, email not confirmed, expired link |
| `/forgot-password` | Logged out | Request a reset email | Always "If an account exists…" |
| `/reset-password` | Recovery session | Choose a new password | Expired/invalid session |
| `/auth/confirm` | Email links | Verifies the token, then redirects | Failure → `/login?error=link` |
| `/home` | Members | Composer + feed of you and the people you follow | Empty: "Your feed grows with who you follow" → Explore |
| `/explore` | Everyone (age-gated) | Everyone's posts, newest first | Empty: "No posts yet — be the first" |
| `/u/[username]` | Everyone (age-gated) | Profile header (name, @username, bio, counts, Follow/Edit), posts | Not found, suspended banner, blocked notice |
| `/p/[id]` | Everyone (age-gated) | Post, its parent (if a reply), replies, reply composer | Removed/unavailable, no replies yet |
| `/settings` | Members | Edit profile, avatar, change password link, blocked list, delete account | Save success / errors |
| `/mod` | Moderators | Open reports queue with snapshots and actions | Empty: "Queue is clear" |
| `/legal/terms`, `/legal/privacy`, `/legal/guidelines`, `/contact` | Everyone (not gated) | Legal and contact | — |

## Post card anatomy
```
[avatar] Display Name  @username · 2h                       [⋯ menu]
         ↻ Reposted by @someone            (repost only)
         Replying to @parent               (reply only)
         Body text, links auto-detected (rel="nofollow ugc noopener")
         [photo grid 1–4, alt text, fixed aspect boxes → no CLS]
         [reply 3]   [repost 1]   [trichome like 12]
```
The menu offers Delete (own post), or Report post and Block @username (others').

## Flows
**Join:** `/age` → `/` → `/signup` → `/check-email` → email link →
`/auth/confirm` → `/home` (empty-feed state invites you to Explore and the newest members).

**Post with photos:** composer → pick up to 4 photos → each is resized and
re-encoded in the browser (EXIF/GPS dropped) → uploaded to
`post-media/<uid>/<uuid>.webp` → add alt text → "Post" → `createPost` → the feed refreshes.
On failure the upload is cleaned up and the inline error explains what happened.

**Report → moderation:** ⋯ → Report post → reason + details → "Report sent.
Moderators review reports within 24 hours." → `/mod` shows it → a moderator acts →
the post disappears for everyone except the author and moderators.

**Block:** ⋯ → Block @name → a confirm dialog explains: "You won't see each
other's posts, and you'll both stop following each other." → done. Undo from
the profile or Settings.

**Delete account:** Settings → Danger zone → type DELETE → everything is removed
→ signed out → `/`.

## Mobile web (375 px first)
Top bar: wordmark. Bottom tab bar: Home · Explore · Post (opens the composer
sheet) · Profile. The right-rail content moves under the feed on Explore.
