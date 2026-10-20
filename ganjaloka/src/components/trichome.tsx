import type { Ripeness } from "@/lib/ripeness";
import { cn } from "@/lib/utils";

const HEAD: Record<Ripeness, string> = {
  clear: "var(--trichome-clear)",
  milky: "var(--trichome-milky)",
  amber: "var(--accent)",
};

/** The signature glyph: a glandular trichome — stalk + resin head. */
export function Trichome({
  ripeness,
  liked,
  className,
}: {
  ripeness: Ripeness;
  liked: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("trichome size-5", className)}
      data-liked={liked}
      data-ripeness={ripeness}
    >
      <path d="M12 20.5V13" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M9 20.5h6" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="8" r="5" stroke={HEAD[ripeness]} strokeWidth="2" fill="none" />
      <circle className="trichome-head-fill" cx="12" cy="8" r="3.6" fill={HEAD[ripeness]} />
    </svg>
  );
}
