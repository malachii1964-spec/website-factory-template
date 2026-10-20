// Request gating rules, kept pure so they can be unit-tested.
//   1. Logged-out visitors must pass the 21+ age gate before any content.
//   2. Member-only pages require a session.
//   3. Members skip the marketing/auth pages.

export const AGE_COOKIE = "gl_age";
export const AGE_COOKIE_VALUE = "21";
export const AGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Reachable without the age gate: the gate itself, legal/contact pages, and
// email-link handling (members confirming accounts are already 21+ attested).
const UNGATED_PREFIXES = ["/age", "/legal", "/contact", "/auth/"];
const MEMBER_ONLY_PREFIXES = ["/home", "/settings", "/mod", "/reset-password"];
const MEMBER_SKIPS = ["/", "/login", "/signup", "/age"];

function matches(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix || path.startsWith(`${prefix}/`),
  );
}

export type GateDecision =
  | { action: "next" }
  | { action: "redirect"; to: string };

export function decideGate(input: {
  path: string;
  search: string;
  isMember: boolean;
  hasAgeCookie: boolean;
}): GateDecision {
  const { path, search, isMember, hasAgeCookie } = input;
  const here = `${path}${search}`;

  if (isMember) {
    if (MEMBER_SKIPS.includes(path)) return { action: "redirect", to: "/home" };
    return { action: "next" };
  }
  if (!hasAgeCookie && !matches(path, UNGATED_PREFIXES)) {
    return { action: "redirect", to: `/age?next=${encodeURIComponent(here)}` };
  }
  if (matches(path, MEMBER_ONLY_PREFIXES)) {
    return { action: "redirect", to: `/login?next=${encodeURIComponent(here)}` };
  }
  return { action: "next" };
}
