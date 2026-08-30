import { Sprout } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-lake-tint text-center">
      <p className="container-page flex items-center justify-center gap-2 py-2 text-xs text-lake sm:text-[0.8rem]">
        <Sprout className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">
          Cut this week, not trucked in last month — order for pickup or local delivery.
        </span>
      </p>
    </div>
  );
}
