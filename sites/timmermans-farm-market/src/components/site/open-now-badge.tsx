import type { StandStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

// Purely presentational — status is computed server-side (see lib/hours.ts)
// and passed in as a prop, so this component ships zero client JS. The page
// it's rendered on sets `export const revalidate = 60` so the status stays
// within a minute of accurate without any client-side polling.
export function OpenNowBadge({ status, className }: { status: StandStatus; className?: string }) {
  if (status.status === "open") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-crate/30 bg-crate/10 px-3 py-1 text-sm font-semibold text-crate-deep",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-crate" />
        Open now &middot; closes {status.closesAt}
      </span>
    );
  }

  if (status.status === "closed-today") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-barn/30 bg-barn/10 px-3 py-1 text-sm font-semibold text-barn-deep",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-barn" />
        Closed now &middot; opens {status.opensAt}
      </span>
    );
  }

  if (status.status === "closed-all-day") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-barn/30 bg-barn/10 px-3 py-1 text-sm font-semibold text-barn-deep",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-barn" />
        Closed today &middot; opens {status.opensAt}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-cream-line bg-paper-deep px-3 py-1 text-sm font-semibold text-espresso-soft",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-espresso-soft" />
      Closed for the season &middot; back in {status.opensInMonth}
    </span>
  );
}
