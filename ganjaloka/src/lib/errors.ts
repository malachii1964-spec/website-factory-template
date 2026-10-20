// Stable error codes shared by the database (GL_*), the server and clients.

export const ERROR_MESSAGES = {
  GL_UNDER_21: "You must be 21 or older to join GANJALOKA.",
  GL_INVALID_BIRTH_DATE: "Enter your full date of birth.",
  GL_TERMS_REQUIRED: "Accept the Terms and Community Guidelines to continue.",
  GL_INVALID_USERNAME: "Use 3–20 lowercase letters, numbers or underscores.",
  GL_USERNAME_TAKEN: "That username is taken. Try adding a number or underscore.",
  GL_SUSPENDED: "Your account is suspended, so you can't post or interact. Contact us if you think this is a mistake.",
  GL_RATE_LIMITED: "You're going a little fast. Wait a minute and try again.",
  GL_POST_UNAVAILABLE: "That post isn't available anymore.",
  GL_PROFILE_UNAVAILABLE: "That profile isn't available anymore.",
  GL_BLOCKED: "You can't interact with this account.",
  GL_INVALID_MEDIA: "One of the photos didn't upload correctly. Remove it and try again.",
  GL_FORBIDDEN: "You don't have permission to do that.",
  GL_INVALID_ACTION: "That action doesn't apply here.",
  GL_NOT_FOUND: "We couldn't find that.",
  VALIDATION: "Check the highlighted fields and try again.",
  CONTENT_BLOCKED: "This breaks the Community Guidelines.",
  UNAUTHENTICATED: "Log in to do that.",
  ALREADY_DONE: "Already done.",
  UNKNOWN: "Something went wrong on our side. Try again in a moment.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export type ActionError = { code: ErrorCode; message: string; fields?: Record<string, string> };
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  message: string = ERROR_MESSAGES[code],
  fields?: Record<string, string>,
): { ok: false; error: ActionError } {
  return { ok: false, error: fields ? { code, message, fields } : { code, message } };
}

/** Map a Supabase/PostgREST error (or anything thrown) to an ActionError. */
export function fromDbError(error: unknown): { ok: false; error: ActionError } {
  const raw = error as { code?: string; message?: string } | null;
  const message = raw?.message ?? "";
  const glCode = /\bGL_[A-Z0-9_]+\b/.exec(message)?.[0];
  if (glCode && glCode in ERROR_MESSAGES) return fail(glCode as ErrorCode);
  if (raw?.code === "23505") return fail("ALREADY_DONE");
  if (raw?.code === "42501") return fail("GL_FORBIDDEN");
  return fail("UNKNOWN");
}
