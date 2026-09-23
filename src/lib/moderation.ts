/**
 * Automated media screening for community uploads.
 *
 * Graceful-offline by design, same pattern as plant-doctor.ts (no
 * ANTHROPIC_API_KEY) and medical-intake.ts (no RESEND_API_KEY): without
 * SIGHTENGINE_API_USER/SIGHTENGINE_API_SECRET configured, every upload is
 * trusted at publish time and moderation relies on the report button +
 * shouldAutoHide threshold alone (see social-logic.ts). This is a real,
 * working fallback — not a broken feature — and is documented as a known
 * limitation until a moderation provider key is supplied, exactly like the
 * unwired welcome email in the Project Log.
 */

export type ScreenResult = { flagged: boolean; reason?: string };

function isConfigured(): boolean {
  return Boolean(
    process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET,
  );
}

/**
 * Screens one uploaded media URL. Returns `{ flagged: false }` whenever the
 * provider isn't configured or the call itself fails — a screening outage
 * must never block a grower from posting; it only forfeits the automated
 * pre-screen, leaving the report button as the safety net.
 */
export async function screenMediaUrl(
  url: string,
  kind: "photo" | "video",
): Promise<ScreenResult> {
  if (!isConfigured()) return { flagged: false };
  // Video screening isn't supported by the nudity-detection endpoint used
  // here; video relies on report-button moderation until that's wired up.
  if (kind === "video") return { flagged: false };

  try {
    const params = new URLSearchParams({
      url,
      models: "nudity-2.1,offensive",
      api_user: process.env.SIGHTENGINE_API_USER!,
      api_secret: process.env.SIGHTENGINE_API_SECRET!,
    });
    const res = await fetch(
      `https://api.sightengine.com/1.0/check.json?${params.toString()}`,
    );
    if (!res.ok) return { flagged: false };
    const data = (await res.json()) as {
      nudity?: { sexual_activity?: number; sexual_display?: number };
      offensive?: { prob?: number };
    };
    const nudityScore = Math.max(
      data.nudity?.sexual_activity ?? 0,
      data.nudity?.sexual_display ?? 0,
    );
    const offensiveScore = data.offensive?.prob ?? 0;
    if (nudityScore > 0.5) return { flagged: true, reason: "nudity" };
    if (offensiveScore > 0.5) return { flagged: true, reason: "offensive" };
    return { flagged: false };
  } catch {
    // Network/provider failure — never blocks posting.
    return { flagged: false };
  }
}
