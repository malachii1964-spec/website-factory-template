// The signature: a post's trichome ripens with appreciation,
// the way growers judge harvest — clear, then milky, then amber.

export type Ripeness = "clear" | "milky" | "amber";

export const AMBER_AT = 25;

export function ripenessFor(likeCount: number): Ripeness {
  if (likeCount >= AMBER_AT) return "amber";
  if (likeCount >= 1) return "milky";
  return "clear";
}
