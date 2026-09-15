import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The owner's brand assets, and whether they are actually here yet.
 *
 * Same principle as the NEEDS OWNER contact details in farm.ts: the site does
 * not fake, approximate or placeholder somebody's brand. It checks whether the
 * real file is on disk and renders the better thing when it is.
 *
 * Detection is a filesystem check, which runs at build time because every page
 * that uses it is prerendered. Dropping a file in therefore takes effect on the
 * next deploy — which is the same moment the file reaches the server anyway.
 *
 * WHAT TO DROP IN, and where:
 *
 *   public/brand/emblem.png  the ring-and-roots mark on a transparent
 *                            background, square, ideally 1024px or larger
 *   public/brand/hero.jpg    the breakwall-and-lighthouse photograph, at
 *                            least 2000px wide, landscape
 *
 * Nothing else is needed. The hero swaps its simulated horizon for the real
 * photograph, the header and footer gain the emblem, and the share card
 * composites it — all automatically, all verified by scripts/verify-brand.mjs.
 */

const BRAND_DIR = join(process.cwd(), "public", "brand");

export type BrandAsset = {
  /** Public URL, usable by next/image. */
  src: string;
  present: boolean;
};

function asset(file: string): BrandAsset {
  return {
    src: `/brand/${file}`,
    present: existsSync(join(BRAND_DIR, file)),
  };
}

/**
 * The emblem. Checked in a few spellings so a file named the obvious way
 * works without the owner having to match a convention exactly.
 */
export function emblem(): BrandAsset {
  for (const name of ["emblem.png", "logo.png", "emblem.webp", "logo.webp"]) {
    const a = asset(name);
    if (a.present) return a;
  }
  return { src: "/brand/emblem.png", present: false };
}

/** The hero photograph — the breakwall at sunset the whole palette comes from. */
export function heroImage(): BrandAsset {
  for (const name of ["hero.jpg", "hero.jpeg", "hero.webp", "hero.png"]) {
    const a = asset(name);
    if (a.present) return a;
  }
  return { src: "/brand/hero.jpg", present: false };
}

/**
 * Alt text for the emblem.
 *
 * It is a logo, not decoration, and it is the only image identifying the farm,
 * so it gets a real description rather than the farm name repeated.
 */
export const EMBLEM_ALT =
  "The Lake Erie IronRoots mark: a forged ring with a root system spreading beneath it.";

export const HERO_ALT =
  "The breakwall and lighthouse on Lake Erie at sunset, looking out over the water.";
