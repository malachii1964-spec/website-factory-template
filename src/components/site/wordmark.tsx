import { cn } from "@/lib/utils";

/**
 * Brand wordmark. The "FD" monogram is a CSS/chrome stand-in for the real
 * logo — drop the logo PNG at /public/logo.png and swap the <span> monogram
 * for <Image src="/logo.png" .../> to use the artwork.
 */
export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-[0.55rem] border border-border-strong bg-gradient-to-b from-surface-2 to-background text-[0.82rem] font-semibold leading-none text-accent shadow-[0_0_0_1px_rgba(139,123,255,0.15),0_0_16px_-6px_var(--accent)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        FD
      </span>
      {!compact && (
        <span className="text-[1.12rem] font-semibold tracking-tight">
          <span className="chrome-text">FutureDesk</span>
          <span className="text-accent">AI</span>
        </span>
      )}
    </span>
  );
}
