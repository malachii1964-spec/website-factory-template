# 04 — API Contracts

## Conventions
- **Writes** are Server Actions in `src/actions/*` (phase 1) and `/api/v1/*`
  route handlers (phase 4, same logic). Every write:
  1. parses input with the Zod schema in `src/lib/validation.ts`;
  2. resolves the member from the session (never from input);
  3. runs `src/lib/moderation` on any user text;
  4. calls Supabase **as the member** (RLS applies), except account deletion
     (admin API);
  5. returns an `ActionResult`, never throws to the client.

```ts
type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; field?: string } };
```
- **Error codes:** the DB `GL_*` codes (see `03-data-model.md`) plus app codes
  `VALIDATION`, `CONTENT_BLOCKED`, `UNAUTHENTICATED`, `ALREADY_DONE`, `UNKNOWN`.
  `src/lib/errors.ts` maps each one to a human sentence.
- **Reads** happen in Server Components through `src/lib/queries.ts`, which wraps
  the feed RPCs and adds authors, repost originals and the viewer's like and
  repost state.

## Auth (`src/actions/auth.ts`)
| Action | Input | Result / side effects |
|---|---|---|
| `confirmAge` | `{ next }` | Sets the `gl_age=21` cookie (30 days, httpOnly, SameSite=Lax), redirects to `next` (same-origin paths only) |
| `signUp` | `{ email, password (10–72, letters + digits), username, displayName, birthDate (YYYY-MM-DD), acceptTerms: true }` | Checks 21+, username format, reserved names and availability, and filters the name. Calls `supabase.auth.signUp` with metadata. Redirects to `/check-email`. Always reports success for an already-registered email (no account enumeration) |
| `signIn` | `{ email, password, next }` | `signInWithPassword` → redirect to `next` or `/home`. Errors: wrong credentials, email not confirmed |
| `requestPasswordReset` | `{ email }` | `resetPasswordForEmail` with the recovery template. Always reports success |
| `updatePassword` | `{ password }` | Requires the recovery session. `auth.updateUser({ password })` |
| `signOut` | — | `auth.signOut()` → `/` |

Route handler `GET /auth/confirm?token_hash&type&next` calls `verifyOtp`, sets
the session and redirects to `next` (same-origin only), or to
`/login?error=link` on failure.

## Profile (`src/actions/profile.ts`)
| Action | Input | Notes |
|---|---|---|
| `updateProfile` | `{ displayName (1–50), bio (≤160), avatarPath? }` | Filtered text; `avatarPath` must be `<uid>/avatar-<ts>.webp` |
| `deleteAccount` | `{ confirm: "DELETE" }` | Deletes the member's storage objects (except media in open reports), then `auth.admin.deleteUser`. DB cascades the rest. Signs out |

## Posts (`src/actions/posts.ts`)
| Action | Input | Notes |
|---|---|---|
| `createPost` | `{ body (≤500), media: [{ path, w, h, alt (≤300) }] (≤4), replyToId? }` | Text or at least one photo is required. Filter → insert. DB enforces the rest |
| `deletePost` | `{ postId }` | Own posts only (RLS). Removes media files unless an open report references the post |
| `toggleRepost` | `{ postId, reposted }` | Inserts or deletes the member's repost row |
| `toggleLike` | `{ postId, liked }` | Inserts or deletes the `likes` row. Idempotent (`23505` = already liked) |

## Social graph (`src/actions/social.ts`)
| Action | Input | Notes |
|---|---|---|
| `toggleFollow` | `{ profileId, following }` | Self-follow rejected by a DB check |
| `toggleBlock` | `{ profileId, blocked }` | Blocking also removes follows both ways (trigger) |

## Safety (`src/actions/reports.ts`, `src/actions/moderation.ts`)
| Action | Input | Notes |
|---|---|---|
| `fileReport` | `{ targetType: "post" \| "profile", targetId, reason, details (≤500) }` | One open report per target per member. 20 per hour |
| `moderate` | `{ reportId, action: "dismiss" \| "remove_post" \| "suspend_member" \| "remove_and_suspend", note? }` | Calls the RPC `moderate_report`, which checks the moderator role in the DB |

## Pagination
Feeds use an opaque cursor: `base64url("<created_at ISO>|<post uuid>")`.
`src/lib/cursor.ts` encodes and decodes it and rejects malformed input. Pages are
20 items, and a page with fewer than 20 items is the last page.

## Phase 2 / 4 endpoints
- `POST /api/video/uploads` and `POST /api/mux/webhook`: see `07-video-pipeline.md`.
- `/api/v1/*` for mobile: see `08-mobile-app.md`.
