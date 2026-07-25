import { cn } from "@/lib/utils";

/**
 * The CCC monogram — three interlocking C's reading as chain links / route
 * loops / a target. One uniform heavy stroke, single color (currentColor),
 * fully reversible, legible from 16px up. No gradients, no bevels.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      role="img"
      aria-label="Chautauqua County Courier"
      className={cn("block", className)}
    >
      {/* Each C is an open arc; they overlap left-to-right like links in a chain */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
      >
        <path d="M27 11 A11 11 0 1 0 27 29" />
        <path d="M43 11 A11 11 0 1 0 43 29" opacity="0.85" />
        <path d="M59 11 A11 11 0 1 0 59 29" opacity="0.7" />
      </g>
    </svg>
  );
}
