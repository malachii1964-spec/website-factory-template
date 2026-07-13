import { z } from "zod";

export const contactTopics = [
  "General question",
  "Plant availability",
  "Hydroponics / grow setup",
  "Trees & shrubs / landscaping",
  "Something else",
] as const;

const trimLower = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

export const contactSchema = z.object({
  name: z.preprocess(trim, z.string().min(2, "Please enter your name").max(80)),
  email: z.preprocess(trimLower, z.email("Enter a valid email address").max(160)),
  phone: z.preprocess(trim, z.string().max(30).optional().or(z.literal(""))),
  topic: z.enum(contactTopics).default("General question"),
  message: z.preprocess(
    trim,
    z
      .string()
      .min(10, "Tell us a little more (at least 10 characters)")
      .max(2000, "That's a bit long — please keep it under 2000 characters"),
  ),
});

/**
 * Honeypot field name. Kept OUT of the schema on purpose: the schema strips it,
 * and the route inspects it directly so bots get a normal-looking success while
 * an accidentally-autofilled real user is never blocked.
 */
export const HONEYPOT_FIELD = "company";

export function isHoneypotTripped(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const v = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim().length > 0;
}

export type ContactInput = z.infer<typeof contactSchema>;
