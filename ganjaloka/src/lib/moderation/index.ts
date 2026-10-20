import { looksLikeSaleSolicitation } from "./sales";
import { containsSlur } from "./slurs";

export type ContentVerdict =
  | { ok: true }
  | { ok: false; reason: "sale" | "hate"; message: string };

export const CONTENT_MESSAGES = {
  sale: "GANJALOKA doesn't allow buying or selling cannabis, including prices, menus, delivery or “DM me” offers. Edit your text and try again.",
  hate: "This includes a slur, which breaks the Community Guidelines. Edit your text and try again.",
} as const;

/** Server-side content filter for every piece of member-written text. */
export function checkContent(...texts: Array<string | null | undefined>): ContentVerdict {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) return { ok: true };
  if (containsSlur(combined)) return { ok: false, reason: "hate", message: CONTENT_MESSAGES.hate };
  if (looksLikeSaleSolicitation(combined)) {
    return { ok: false, reason: "sale", message: CONTENT_MESSAGES.sale };
  }
  return { ok: true };
}
