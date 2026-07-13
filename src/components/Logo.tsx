import { cn } from "@/lib/cn";

/**
 * Wordmark with a small sprout mark. Uses currentColor so it inherits the
 * surrounding text color (paper on dark headers, canopy on light).
 */
export function Logo({ className, showMark = true }: { className?: string; showMark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark && (
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.1" />
          <path d="M16 25 V14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 17 C9 17 6.5 10.5 6.5 10 C13 10 16 14.5 16 17 Z" fill="currentColor" />
          <path
            d="M16 14 C23 14 25.5 7.5 25.5 7 C19 7 16 11.5 16 14 Z"
            fill="var(--color-grow)"
          />
        </svg>
      )}
      <span className="font-display text-[1.35rem] leading-none font-semibold tracking-tight">
        Mike&rsquo;s Nursery
      </span>
    </span>
  );
}
