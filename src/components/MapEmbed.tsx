import { site, addressOneLine } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Google Maps embed, lazy-loaded (below-the-fold, no API key needed). Uses the
 * keyless `maps?q=` embed so there's nothing to configure or leak.
 */
export function MapEmbed({ className }: { className?: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&output=embed`;
  return (
    <iframe
      title={`Map to ${site.name}, ${addressOneLine}`}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("h-full w-full border-0", className)}
    />
  );
}
