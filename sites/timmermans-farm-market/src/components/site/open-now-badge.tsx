"use client";

import { useSyncExternalStore } from "react";
import { getStandStatus, type StandStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  const id = setInterval(callback, 60_000);
  return () => clearInterval(id);
}

// useSyncExternalStore requires getSnapshot to return a stable (===) value
// when nothing has actually changed, or React re-renders forever. Cache by
// minute so repeated calls within the same minute return the same object.
let cachedMinuteKey = "";
let cachedSnapshot: StandStatus | null = null;

function getSnapshot(): StandStatus {
  const now = new Date();
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  if (minuteKey !== cachedMinuteKey || !cachedSnapshot) {
    cachedMinuteKey = minuteKey;
    cachedSnapshot = getStandStatus(now);
  }
  return cachedSnapshot;
}

function getServerSnapshot(): StandStatus | null {
  // Server has no notion of the visitor's local clock — resolved on mount.
  return null;
}

export function OpenNowBadge({ className }: { className?: string }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!state) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-cream-line bg-paper px-3 py-1 text-sm font-medium text-espresso-soft",
          className,
        )}
        aria-hidden="true"
      >
        <span className="h-2 w-2 rounded-full bg-cream-line" />
        Checking hours…
      </span>
    );
  }

  if (state.status === "open") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-crate/30 bg-crate/10 px-3 py-1 text-sm font-semibold text-crate-deep",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-crate" />
        Open now &middot; closes {state.closesAt}
      </span>
    );
  }

  if (state.status === "closed-today") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-barn/30 bg-barn/10 px-3 py-1 text-sm font-semibold text-barn-deep",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-barn" />
        Closed now &middot; opens {state.opensAt}
      </span>
    );
  }

  if (state.status === "closed-all-day") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-barn/30 bg-barn/10 px-3 py-1 text-sm font-semibold text-barn-deep",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-barn" />
        Closed today &middot; opens {state.opensAt}
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
      Closed for the season &middot; back in {state.opensInMonth}
    </span>
  );
}
