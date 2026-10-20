/** "now", "5m", "3h", "4d", then "Oct 3" (this year) or "Oct 3, 2024". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (seconds < 45) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const sameYear = then.getUTCFullYear() === now.getUTCFullYear();
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

/** 999 → "999", 1200 → "1.2K", 3400000 → "3.4M" */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export type BodySegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string }
  | { type: "mention"; value: string; username: string };

const TOKEN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])|(@[a-z0-9_]{3,20})\b/gi;

/** Split post text into plain text, links and @mentions (rendered as React, never as HTML). */
export function segmentBody(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  let last = 0;
  for (const match of body.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ type: "text", value: body.slice(last, index) });
    const [token, url, mention] = match;
    if (url) segments.push({ type: "link", value: url, href: url });
    else if (mention) segments.push({ type: "mention", value: mention, username: mention.slice(1).toLowerCase() });
    last = index + token.length;
  }
  if (last < body.length) segments.push({ type: "text", value: body.slice(last) });
  return segments;
}
