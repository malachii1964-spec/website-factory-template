import { z } from "zod";
import { MINIMUM_AGE, isOldEnough, parseIsoDate } from "./age";

// One set of schemas for every write path (Server Actions now, /api/v1 later).
// The database repeats the critical rules; these give members clear messages.

export const TERMS_VERSION = "2026-10-19";

export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "ganjaloka", "moderator", "mod", "mods",
  "official", "staff", "support", "help", "security", "team", "root",
  "system", "settings", "api", "null", "undefined",
]);

export const LIMITS = {
  postBody: 500,
  photosPerPost: 4,
  altText: 300,
  bio: 160,
  displayName: 50,
  reportDetails: 500,
} as const;

export const uuid = z.uuid({ message: "That link looks broken. Refresh and try again." });

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Enter a valid email address, like name@example.com." }));

export const password = z
  .string()
  .min(10, { message: "Use at least 10 characters." })
  .max(72, { message: "Use 72 characters or fewer." })
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), {
    message: "Use at least one letter and one number.",
  });

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, {
    message: "Use 3–20 lowercase letters, numbers or underscores.",
  })
  .refine((v) => !RESERVED_USERNAMES.has(v), { message: "That username is reserved. Try another." });

export const displayName = z
  .string()
  .trim()
  .min(1, { message: "Add a display name." })
  .max(LIMITS.displayName, { message: `Keep it to ${LIMITS.displayName} characters.` });

export const bio = z
  .string()
  .trim()
  .max(LIMITS.bio, { message: `Keep your bio to ${LIMITS.bio} characters.` });

export const birthDate = z
  .string()
  .refine((v) => parseIsoDate(v) !== null, { message: "Enter your full date of birth." })
  .refine((v) => isOldEnough(v, MINIMUM_AGE), {
    message: `You must be ${MINIMUM_AGE} or older to join GANJALOKA.`,
  });

export const signUpSchema = z.object({
  email,
  password,
  username,
  displayName,
  birthDate,
  acceptTerms: z.literal(true, {
    message: "Accept the Terms and Community Guidelines to continue.",
  }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: "Enter your password." }),
});

export const passwordResetSchema = z.object({ email });
export const newPasswordSchema = z.object({ password });

/** Same-origin relative paths only — blocks open redirects like //evil.com. */
export function safeNextPath(value: unknown, fallback = "/home"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.length > 300) return fallback;
  return value;
}

const MEDIA_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

export const mediaItem = z.object({
  path: z.string().regex(MEDIA_PATH, { message: "That photo upload didn't finish. Remove it and try again." }),
  w: z.number().int().min(1).max(8192),
  h: z.number().int().min(1).max(8192),
  alt: z
    .string()
    .trim()
    .max(LIMITS.altText, { message: `Keep alt text to ${LIMITS.altText} characters.` })
    .default(""),
});

export const createPostSchema = z
  .object({
    body: z
      .string()
      .max(LIMITS.postBody, { message: `Posts can be up to ${LIMITS.postBody} characters.` })
      .transform((v) => v.trim()),
    media: z
      .array(mediaItem)
      .max(LIMITS.photosPerPost, { message: `Add up to ${LIMITS.photosPerPost} photos.` })
      .default([]),
    replyToId: uuid.optional(),
  })
  .refine((v) => v.body.length > 0 || v.media.length > 0, {
    message: "Write something or add a photo.",
    path: ["body"],
  });

export const profileSchema = z.object({
  displayName,
  bio,
  avatarPath: z
    .string()
    .regex(/^[0-9a-f-]{36}\/avatar-\d{10,16}\.webp$/)
    .nullable()
    .optional(),
});

export const REPORT_REASONS = [
  { value: "sale", label: "Buying or selling cannabis" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate or slurs" },
  { value: "sexual", label: "Sexual content" },
  { value: "minor_safety", label: "Involves someone under 21 / child safety" },
  { value: "violence", label: "Violence or threats" },
  { value: "spam", label: "Spam or scam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const reportSchema = z.object({
  targetType: z.enum(["post", "profile"]),
  targetId: uuid,
  reason: z.enum(REPORT_REASONS.map((r) => r.value) as [ReportReason, ...ReportReason[]], {
    message: "Pick a reason.",
  }),
  details: z
    .string()
    .trim()
    .max(LIMITS.reportDetails, { message: `Keep details to ${LIMITS.reportDetails} characters.` })
    .default(""),
});

export const moderationSchema = z.object({
  reportId: uuid,
  action: z.enum(["dismiss", "remove_post", "suspend_member", "remove_and_suspend"]),
  note: z.string().trim().max(500).optional(),
});

/** First message per field, for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
