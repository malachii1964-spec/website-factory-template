// Incoming webhook payload is UNTRUSTED_EXTERNAL_CONTENT (MALACHII Kernel §5)
// and validated at the boundary per CLAUDE.md Rule 4 ("Validate all user input with Zod").
import { z } from "zod";

export const incomingEventSchema = z.object({
  eventId: z.string().min(1).max(128),
  route: z.string().url(),
  customerText: z.string().max(4000),
  customerScreenshotBase64: z
    .string()
    .max(15_000_000) // ~11MB decoded — comfortably under the API's 32MB request cap with room for the rest of the payload
    .optional(),
  repoPath: z.string().min(1),
});

export type IncomingEventInput = z.infer<typeof incomingEventSchema>;
