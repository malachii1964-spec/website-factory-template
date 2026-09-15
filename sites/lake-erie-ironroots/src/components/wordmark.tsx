import Image from "next/image";
import { emblem, EMBLEM_ALT } from "@/lib/brand";
import { FARM } from "@/lib/farm";

/**
 * The typographic lockup: letterspaced "LAKE ERIE" over "IRONROOTS", matching
 * the proportions of the brand artwork.
 *
 * This never DRAWS the emblem. The ring-and-roots mark is the owner's asset and
 * an approximation of somebody's logo is worse than its absence — but when the
 * real file is at public/brand/emblem.png it is rendered here, above the
 * lockup in the hero and beside it in the header. See lib/brand.ts.
 */
export function Wordmark({
  size = "sm",
  as: Tag = "span",
}: {
  size?: "sm" | "lg";
  as?: "span" | "h1";
}) {
  const large = size === "lg";
  const mark = emblem();

  return (
    <Tag className={large ? "block leading-none" : "flex items-center gap-2.5"}>
      {mark.present && (
        <Image
          src={mark.src}
          alt={large ? EMBLEM_ALT : ""}
          width={large ? 132 : 30}
          height={large ? 132 : 30}
          priority={large}
          className={
            large
              ? "rise mb-6 h-20 w-20 object-contain md:h-32 md:w-32"
              : "h-[30px] w-[30px] shrink-0 object-contain"
          }
        />
      )}
      <span className="block leading-none">
      <span
        className="label block"
        style={{
          fontSize: large ? "0.8125rem" : "0.5625rem",
          letterSpacing: large ? "0.62em" : "0.38em",
        }}
      >
        {FARM.overline}
      </span>
      <span
        className="display wordmark-lockup mt-1 block uppercase"
        style={{
          fontSize: large ? "clamp(3.25rem, 13vw, 7.5rem)" : "1.375rem",
          letterSpacing: large ? "0.02em" : "0.01em",
          /*
            The lit edge of the forged wordmark: light from above, mass below.
            Deliberately a narrow parchment-to-gold ramp and nothing else — an
            earlier version ran through --iron in the middle, which dropped the
            centre of the logotype to grey, and a wide four-stop metallic sheen
            is the luxury-template tell this whole palette is trying to avoid.
          */
          backgroundImage:
            "linear-gradient(176deg, var(--color-gold-lit) 0%, var(--color-parchment) 30%, var(--color-parchment) 58%, var(--color-gold) 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {FARM.wordmark}
      </span>
      </span>
    </Tag>
  );
}
