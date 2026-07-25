/**
 * Slim status strip — reads like a dispatch board header. Honest framing of the
 * Pip's gap (no date/reason stated as fact).
 */
export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-surface-2 text-center">
      <p className="container-page readout flex items-center justify-center gap-2 py-1.5 text-[0.72rem] text-muted-foreground sm:text-xs">
        <span className="status-dot" aria-hidden />
        <span>
          <span className="font-medium text-foreground">Now serving all of Chautauqua County</span>
          <span className="hidden sm:inline"> — filling the gap Pip&rsquo;s Delivery left.</span>
        </span>
      </p>
    </div>
  );
}
