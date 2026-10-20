import Image from "next/image";
import { publicMediaUrl } from "@/lib/env";
import type { MediaItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Fixed-geometry photo layout so nothing shifts while images load (CLS 0). */
export function PhotoGrid({ media, preload = false }: { media: MediaItem[]; preload?: boolean }) {
  if (media.length === 0) return null;

  if (media.length === 1) {
    const [m] = media as [MediaItem];
    // Clamp extreme aspect ratios between 4:5 (tall) and 16:9 (wide).
    const ratio = Math.min(Math.max(m.w / m.h, 4 / 5), 16 / 9);
    return (
      <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-surface-2" style={{ aspectRatio: ratio }}>
        <Image
          src={publicMediaUrl("post-media", m.path)}
          alt={m.alt}
          fill
          preload={preload}
          sizes="(min-width: 640px) 560px, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("mt-3 grid gap-1 overflow-hidden rounded-2xl border border-border", "grid-cols-2")}>
      {media.map((m, i) => (
        <div
          key={m.path}
          className={cn("relative bg-surface-2", media.length === 3 && i === 0 ? "row-span-2 aspect-[1/2]" : "aspect-square")}
        >
          <Image
            src={publicMediaUrl("post-media", m.path)}
            alt={m.alt}
            fill
            preload={preload && i === 0}
            sizes="(min-width: 640px) 280px, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
