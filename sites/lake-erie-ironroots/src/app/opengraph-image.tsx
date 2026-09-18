import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { FARM, establishedLine } from "@/lib/farm";

export const alt = `${FARM.name} — organic growing, ${FARM.county}, ${FARM.state}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card — the one image of this brand that travels.
 *
 * It is the printed sheet, at share-card size: paper, two inks, a heavy rule,
 * and nothing else. The previous version was a dark card with a gold overline
 * and an orange radial glow, which is the aesthetic the whole rebuild moved
 * away from; a share card that contradicts the site is worse than none.
 *
 * The two faces are committed as TTFs under src/assets/fonts and read from disk
 * rather than fetched at build time: satori cannot read woff2, and a versioned
 * gstatic URL changes without warning, so a card that silently fell back to
 * Helvetica would be broken in a way nobody notices. The files are used only
 * during the build and are never shipped to a browser.
 *
 * Newsreader ships as a variable font and satori cannot parse one — it fails
 * with an opaque "cannot read properties of undefined" during prerender — so
 * the committed file is a static instance pinned at wght 600 with the
 * fvar/gvar/avar/HVAR/STAT tables stripped. Regenerate it the same way if the
 * face is ever changed; a variable TTF dropped in here will break the build.
 */
export default async function OpengraphImage() {
  const fonts = join(process.cwd(), "src/assets/fonts");
  const [serif, mono] = await Promise.all([
    readFile(join(fonts, "Newsreader-SemiBold.ttf")),
    readFile(join(fonts, "IBMPlexMono-Medium.ttf")),
  ]);

  const PAPER = "#F4F1EA";
  const INK = "#1B1916";
  const INK2 = "#4B4439";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px 84px",
          background: PAPER,
          fontFamily: "Plex Mono",
        }}
      >
        {/* masthead */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, color: INK2 }}>
            {FARM.overline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 148,
              lineHeight: 1,
              color: INK,
              fontFamily: "Newsreader",
            }}
          >
            {FARM.wordmark}
          </div>
        </div>

        {/* the rule, and what sits under it */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              color: INK,
              fontFamily: "Newsreader",
            }}
          >
            {FARM.tagline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              paddingTop: 26,
              borderTop: `2px solid ${INK}`,
              fontSize: 24,
              color: INK2,
            }}
          >
            {FARM.address.locality}, {FARM.state} &middot; {FARM.county} &middot;{" "}
            {establishedLine()}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: serif, style: "normal", weight: 600 },
        { name: "Plex Mono", data: mono, style: "normal", weight: 500 },
      ],
    },
  );
}
