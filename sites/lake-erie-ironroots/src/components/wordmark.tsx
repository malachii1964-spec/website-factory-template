import { FARM } from "@/lib/farm";

/**
 * The typographic lockup: letterspaced "LAKE ERIE" over "IRONROOTS", matching
 * the proportions of the brand artwork.
 *
 * This deliberately does NOT draw the emblem. The ring-and-roots mark is the
 * owner's asset; an approximation of someone's logo is worse than its absence.
 * When the file lands in /public/brand/ it replaces this lockup in the hero
 * and sits beside it in the header.
 */
export function Wordmark({
  size = "sm",
  as: Tag = "span",
}: {
  size?: "sm" | "lg";
  as?: "span" | "h1";
}) {
  const large = size === "lg";
  return (
    <Tag className="block leading-none">
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
    </Tag>
  );
}
