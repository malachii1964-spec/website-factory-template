import { Heart } from "lucide-react";

/**
 * Owner's pledge, stated in the brand's own words. Not an official St. Jude
 * partnership claim — no St. Jude logo/branding is used.
 */
export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-surface-2 text-center">
      <p className="container-page flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground sm:text-[0.8rem]">
        <Heart className="h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor" />
        <span>
          <span className="font-medium text-foreground">50% of every sale</span>{" "}
          supports St. Jude Children&rsquo;s Research Hospital &amp; homeless
          veterans.
        </span>
      </p>
    </div>
  );
}
