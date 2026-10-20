# 08 — Mobile Apps (Phase 4: iPhone + Android)

## Stack
| Piece | Choice (versions current 2026-10-19) |
|---|---|
| Framework | Expo SDK 58 (React Native 0.88), TypeScript strict |
| Navigation | expo-router (file-based, mirrors the web routes) |
| Backend | The same Supabase project. `@supabase/supabase-js` with session storage in `expo-secure-store` |
| Writes | `POST /api/v1/*` on the Next.js app with a `Authorization: Bearer <supabase access token>` header, so validation, the content filter and rate limits run in one place |
| Reads | supabase-js straight to the RPCs (`home_feed`, `explore_feed`, …), with RLS as the boundary |
| Media | `expo-image-picker` → `expo-image-manipulator` (resize + re-encode drops EXIF/GPS) → Supabase Storage |
| Video (after phase 2) | `expo-video` for HLS playback; uploads PUT to the Mux direct-upload URL |
| Push (after phase 3) | `expo-notifications` + an Edge Function or route that sends from a notifications table |
| Builds and releases | EAS Build + EAS Submit; OTA JS updates with EAS Update (no native changes) |

## Repo layout once mobile starts
```
ganjaloka/            ← this Next.js app (web + /api/v1)
ganjaloka-mobile/     ← Expo app (separate package, shares types)
  app/(tabs)/home.tsx  explore.tsx  compose.tsx  profile.tsx
  app/p/[id].tsx  app/u/[username].tsx  app/settings.tsx
  lib/supabase.ts  lib/api.ts  (typed client for /api/v1)
```
Share `Database` types by copying `src/lib/supabase/database.types.ts`, or by
moving shared code to a `packages/shared` workspace when both apps exist.

## Screens (match the web, see `05-screens-and-flows.md`)
Tabs: **Home · Explore · Post (+) · Profile**, plus Settings in the profile.

## `/api/v1` write endpoints (built in phase 4, mirroring the Server Actions)
| Method + path | Body | Server Action equivalent |
|---|---|---|
| `POST /api/v1/posts` | `{ body, media[], replyToId? }` | `createPost` |
| `DELETE /api/v1/posts/:id` | — | `deletePost` |
| `POST /api/v1/posts/:id/like` · `DELETE …` | — | `toggleLike` |
| `POST /api/v1/posts/:id/repost` · `DELETE …` | — | `toggleRepost` |
| `POST /api/v1/members/:id/follow` · `DELETE …` | — | `toggleFollow` |
| `POST /api/v1/members/:id/block` · `DELETE …` | — | `toggleBlock` |
| `POST /api/v1/reports` | `{ targetType, targetId, reason, details }` | `fileReport` |
| `PATCH /api/v1/me` | `{ displayName, bio, avatarPath }` | `updateProfile` |
| `DELETE /api/v1/me` | `{ confirm: "DELETE" }` | `deleteAccount` |

Each one reuses the same `src/lib/validation.ts` Zod schemas and
`src/lib/moderation` filter. They return `{ ok: true, data } | { ok: false, error: { code, message } }`.

## Auth on mobile
- Email + password sign-up and login with supabase-js.
- Email links open the app via a universal link / App Link to
  `https://<domain>/auth/confirm`. The web route verifies the token and, on
  mobile, deep-links back with a session (`ganjaloka://auth-callback`).
- The 21+ birth date is collected in the sign-up form and enforced by the same
  DB trigger.

## Store submission checklist
- [ ] Apple developer account in the **company's** name (guideline 5.1.1(ix)).
- [ ] Age rating questionnaire: answer honestly (drug references, user-generated content) and expect the highest age rating.
- [ ] Report, block and filter visible without hunting (guideline 1.2 / Play UGC policy).
- [ ] In-app account deletion (guideline 5.1.1(v)).
- [ ] No sales, prices, menus or delivery anywhere in the app (guideline 1.4.3 / Play marijuana policy).
- [ ] Demo account for App Review with sample content.
- [ ] Privacy nutrition labels and Play Data Safety form match `06` section 5.
- [ ] Contact email and support URL published.
