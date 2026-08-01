import { z } from "zod";

// The kinds of run a customer can request. Kept plain-language for seniors.
export const REQUEST_TYPES = [
  "Delivery",
  "Errand / pickup",
  "Multi-stop run",
  "Wait-and-return",
  "Senior / weekly route",
  "Seasonal-home concierge",
  "Business delivery",
  "Something else",
] as const;

export const TIMING_OPTIONS = [
  "As soon as possible",
  "Later today",
  "This week",
  "Scheduled / recurring",
] as const;

export const requestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number we can reach you at")
    .max(30),
  requestType: z.enum(REQUEST_TYPES),
  timing: z.enum(TIMING_OPTIONS),
  pickup: z.string().trim().max(200).optional().or(z.literal("")),
  dropoff: z.string().trim().max(200).optional().or(z.literal("")),
  details: z
    .string()
    .trim()
    .min(5, "Tell us a little about the run")
    .max(2000, "That's a bit long — keep it under 2000 characters"),
  // Honeypot: real people leave this blank; bots fill it.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type RequestInput = z.infer<typeof requestSchema>;
