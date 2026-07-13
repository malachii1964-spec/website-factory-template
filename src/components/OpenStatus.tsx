"use client";

import { useEffect, useState } from "react";
import { getOpenStatus, type OpenStatus as Status } from "@/lib/hours";
import { cn } from "@/lib/cn";

/**
 * Live "Open now / Closed" indicator. Computed on the client from the visitor's
 * clock (converted to the business timezone) so it's always current, and
 * re-checked every minute. Renders a neutral state before mount to avoid
 * hydration mismatch.
 */
export function OpenStatus({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const isOpen = status?.isOpen ?? false;
  const label = status ? status.message : "Checking hours…";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        className,
      )}
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {status && isOpen && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sprout opacity-75 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            !status ? "bg-mist" : isOpen ? "bg-sprout" : "bg-loam-soft",
          )}
        />
      </span>
      {!compact && <span>{label}</span>}
    </span>
  );
}
