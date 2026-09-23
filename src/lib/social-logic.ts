/**
 * Pure logic for the community feature — handle rules, moderation
 * thresholds, and strain-passport aggregation. No I/O, no session, no db.
 * Persistence lives in social-posts.ts; this is what it calls into.
 */

import { getStage, type StageId } from "@/lib/stages";

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export function isValidHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

/**
 * Turns a display name / email local-part into a candidate handle.
 * Not guaranteed unique — the persistence layer appends a numeric suffix
 * on collision.
 */
export function slugifyHandle(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  const padded = base.length >= 3 ? base : `${base}grower`.slice(0, 20);
  return isValidHandle(padded) ? padded : "grower";
}

export function isValidStageId(value: string): value is StageId {
  return getStage(value) !== undefined;
}

/** Reports needed before a post auto-hides pending human review. */
export const REPORT_HIDE_THRESHOLD = 3;

export function shouldAutoHide(reportCount: number): boolean {
  return reportCount >= REPORT_HIDE_THRESHOLD;
}

export type ModerationStatus = "visible" | "hidden_pending_review" | "removed";

export function isVisibleStatus(status: string): boolean {
  return status === "visible";
}

// --- Strain passport ---

export type PassportSourcePost = {
  strainSlug: string | null;
  strainName: string | null;
  createdAt: Date;
  coverMediaUrl: string | null;
};

export type PassportEntry = {
  key: string;
  strainSlug: string | null;
  strainName: string;
  postCount: number;
  firstPostedAt: Date;
  lastPostedAt: Date;
  coverMediaUrl: string | null;
};

/**
 * Groups a user's strain-tagged posts into passport entries, most recently
 * posted strain first. Untagged posts (strainName null) are excluded —
 * they simply don't contribute to the passport, not an error.
 *
 * Derived on every read rather than stored, matching the grow-journal
 * pattern (see grow-journal.ts): improving the grouping key later
 * automatically improves every existing passport instead of leaving old
 * rows frozen under the previous logic.
 */
export function buildStrainPassport(
  posts: readonly PassportSourcePost[],
): PassportEntry[] {
  const byKey = new Map<string, PassportEntry>();

  for (const p of posts) {
    if (!p.strainName) continue;
    const key = p.strainSlug ?? `free:${p.strainName.toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        key,
        strainSlug: p.strainSlug,
        strainName: p.strainName,
        postCount: 1,
        firstPostedAt: p.createdAt,
        lastPostedAt: p.createdAt,
        coverMediaUrl: p.coverMediaUrl,
      });
      continue;
    }
    existing.postCount += 1;
    if (p.createdAt < existing.firstPostedAt)
      existing.firstPostedAt = p.createdAt;
    if (p.createdAt > existing.lastPostedAt) {
      existing.lastPostedAt = p.createdAt;
      // Most recent post's photo represents the strain on the passport.
      if (p.coverMediaUrl) existing.coverMediaUrl = p.coverMediaUrl;
    }
  }

  return [...byKey.values()].sort(
    (a, b) => b.lastPostedAt.getTime() - a.lastPostedAt.getTime(),
  );
}
