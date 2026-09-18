import Image from "next/image";
import { Compass } from "@/components/ornament";
import { FARM } from "@/lib/farm";

/**
 * The front door. The page IS the plate.
 *
 * Not the artwork sitting in a box on a page — you land inside the scene. It
 * fills the viewport, and the lit root system runs off the bottom of the frame
 * and dissolves into the content below, so the page is rooted by the same thing
 * the emblem is.
 *
 * How the square plate meets a screen that is never square:
 *
 *   - the SCENE is cut from the plate at two different crops: a wide one for
 *     landscape, and a PORTRAIT one centred on the emblem for phones. Covering
 *     a 0.46 viewport with a 1.57 image amputated the ring and left an
 *     unrecognisable metal column, so this is art direction rather than one
 *     image squeezed into both.
 *   - the WORDMARK is a logo, so it stays an image — bevelled metal letterforms
 *     cannot be reproduced in live type, and approximating them would look
 *     counterfeit beside the real thing.
 *   - everything else is live text, because baked type cannot reflow, cannot be
 *     read aloud, cannot be searched, and turns to mush on a phone.
 *
 * A plain <picture> for the scene rather than next/image: art direction needs
 * two genuinely different crops behind a media query, the AVIF and WebP pairs
 * are already cut and encoded from the plate, and rendering both through
 * next/image would download the loser. This way the browser fetches exactly
 * one. The wordmark has no such need, so it stays on next/image.
 *
 * The hero is sticky on wide screens, so it holds its place while the content
 * rises over it. That is layout, not animation — no JavaScript, and it behaves
 * identically with reduced motion.
 */

const SCENE_ALT =
  "The Lake Erie breakwall at sunset. Storm cloud over the water, the lighthouse on the pier, and the IronRoots emblem standing among the black rocks with its root system lit from within.";

export function Hero() {
  return (
    <section
      className="relative flex flex-col overflow-hidden md:sticky md:top-0 md:h-[100svh] md:justify-end"
      aria-label={`${FARM.name} — ${FARM.tagline}`}
    >
      {/*
        On a phone the scene is a BLOCK at its own aspect with the void beneath,
        which is the plate's own composition — picture above, lockup below. It
        was absolutely filling at every width, and cover-cropping a square-ish
        image into a 0.46 viewport sliced both sides off the ring, leaving an
        unrecognisable metal column. From tablet up it fills as before.
      */}
      <div className="relative aspect-[782/778] w-full md:absolute md:inset-0 md:aspect-auto">
        {/*
          Order matters: the browser takes the first <source> whose media AND
          type it supports, so the wide crops must be listed before the portrait
          ones, and AVIF before WebP within each. The <img> is the last resort.
        */}
        <picture>
          <source
            media="(min-width: 48rem)"
            type="image/avif"
            srcSet="/brand/hero-scene.avif"
            width={1254}
            height={800}
          />
          <source
            media="(min-width: 48rem)"
            type="image/webp"
            srcSet="/brand/hero-scene.webp"
            width={1254}
            height={800}
          />
          <source
            type="image/avif"
            srcSet="/brand/hero-scene-portrait.avif"
            width={782}
            height={778}
          />
          <img
            src="/brand/hero-scene-portrait.webp"
            alt={SCENE_ALT}
            width={782}
            height={778}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[50%_46%] md:object-[50%_22%] md:scale-[1.04]"
          />
        </picture>

        {/* Warm lift under the emblem, taken from the plate's own light. */}
        <div className="ember-wash pointer-events-none absolute inset-0" aria-hidden="true" />

        {/* The roots dissolve into the page instead of being cut by a hard edge. */}
        <div
          className="root-veil pointer-events-none absolute inset-x-0 bottom-0 h-[52%] md:h-[70%]"
          aria-hidden="true"
        />
      </div>

      {/* The lockup sits above the scene by DOM order alone; it needs no z-index. */}
      <div className="relative -mt-[16%] flex flex-col items-center px-5 pb-[5vh] text-center md:mt-0 md:pb-[5vh]">
        {/*
          The wordmark carries the brand name, so it is the h1 and its alt text
          is the heading text. Capped in rem as well as vw so it does not become
          a billboard on a wide monitor.
        */}
        <h1 className="m-0 w-full max-w-[min(88vw,38rem)]">
          <Image
            src="/brand/wordmark.webp"
            alt={FARM.name}
            width={1014}
            height={168}
            priority
            sizes="(min-width: 48rem) 38rem, 88vw"
            /*
              A real alpha cutout rather than mix-blend-mode: screen.

              The blend worked only where the scene behind happened to be dark,
              and over the lit roots it left the crop's backing showing as a
              raised rectangle. The committed file carries an alpha channel
              built from the letterforms' own luminance, so it composites
              correctly on anything and needs no stacking-context gymnastics.
            */
            className="h-auto w-full"
          />
        </h1>

        <p className="cut mt-7 max-w-[24ch] text-gold/90 md:mt-9 md:max-w-none">
          {FARM.tagline}
        </p>

        <p className="cut mt-8 flex items-center gap-4 text-stone md:mt-10">
          <span>Estd</span>
          <span className="text-gold/70">
            <Compass size={20} />
          </span>
          <span>{FARM.establishedYear}</span>
        </p>
      </div>

      {/* A quiet cue that there is a page under this, not a decorative arrow. */}
      <p className="relative pt-10 pb-9 text-center md:pt-0 md:pb-7">
        <a
          href="#register"
          className="cut text-stone transition-colors hover:text-gold focus-visible:text-gold"
        >
          What is growing &darr;
        </a>
      </p>
    </section>
  );
}
