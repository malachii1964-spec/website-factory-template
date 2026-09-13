import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { FARM } from "@/lib/farm";

export const alt = `${FARM.name} — organic fruit and vegetables, ${FARM.county}, ${FARM.state}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card — the one image of this brand that travels.
 *
 * The two brand faces are committed as TTFs under src/assets/fonts and read
 * from disk here rather than fetched from Google at build time: a versioned
 * gstatic URL changes without warning, and a share card that silently falls
 * back to Helvetica is a share card nobody notices is broken. The files are
 * used only during the build and are never shipped to a browser.
 *
 * Deliberately typographic. The ring-and-roots emblem is the owner's asset and
 * is not redrawn; once the real file lands in /public/brand it can be
 * composited in here.
 */
export default async function OpengraphImage() {
  const fonts = join(process.cwd(), "src/assets/fonts");
  const [bodoni, archivo] = await Promise.all([
    readFile(join(fonts, "BodoniModa-SemiBold.ttf")),
    readFile(join(fonts, "Archivo-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "84px 90px",
          background: "#0C0F12",
          backgroundImage:
            "radial-gradient(120% 75% at 84% 98%, rgba(226,112,42,0.34) 0%, rgba(12,15,18,0) 60%)",
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 20,
            color: "#C79A3C",
            textTransform: "uppercase",
          }}
        >
          {FARM.overline}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 150,
            letterSpacing: 3,
            color: "#EDE8DC",
            fontFamily: "Bodoni Moda",
            textTransform: "uppercase",
          }}
        >
          {FARM.wordmark}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 44,
            color: "#F0D08A",
            fontFamily: "Bodoni Moda",
          }}
        >
          {FARM.tagline}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 42,
            paddingTop: 24,
            borderTop: "1px solid rgba(199,154,60,0.35)",
            fontSize: 22,
            letterSpacing: 5,
            color: "#8C9296",
            textTransform: "uppercase",
          }}
        >
          Organic fruit &amp; vegetables · {FARM.county} NY
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bodoni Moda", data: bodoni, style: "normal", weight: 600 },
        { name: "Archivo", data: archivo, style: "normal", weight: 500 },
      ],
    },
  );
}
