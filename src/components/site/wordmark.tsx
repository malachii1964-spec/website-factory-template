import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand wordmark: the real FD icon (chrome/violet on black) in a dark chip so
 * it reads as a premium app-mark in both light and dark themes, next to the
 * FutureDeskAI wordmark.
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
      <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-[0.55rem] border border-border-strong bg-[#07060c] shadow-[0_0_0_1px_rgba(139,123,255,0.12),0_0_16px_-8px_var(--accent)]">
        <Image
          src="/fd-icon.png"
          alt="FutureDeskAI"
          width={32}
          height={32}
          className="h-full w-full object-cover"
          priority
        />
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
