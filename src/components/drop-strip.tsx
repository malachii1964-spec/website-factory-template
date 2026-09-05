import Image from "next/image";
import Link from "next/link";
import { activeDrops } from "@/lib/promos";

/**
 * Compact drops teaser for embedding on other pages.
 *
 * Deliberately small: the art is a thumbnail and the codes are not repeated
 * here, so it reads as a pointer rather than an ad break in the middle of
 * educational content. The full cards, copyable codes, and the affiliate
 * disclosure all live on /drops.
 *
 * Renders nothing when no drop is live — an empty promo slot is worse than no
 * promo slot.
 */
export function DropStrip({
  heading = "Live discount codes",
  blurb = "Limited seed drops with working codes — copy one before you check out.",
}: {
  heading?: string;
  blurb?: string;
}) {
  const drops = activeDrops();
  if (drops.length === 0) return null;

  return (
    <section className="glass iris-border rounded-3xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            {heading}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-frost-dim">
            {blurb}
          </p>
        </div>
        <Link
          href="/drops"
          className="btn-iris shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          See all {drops.length} drops →
        </Link>
      </div>

      <ul className="mt-5 flex gap-3 overflow-x-auto pb-1">
        {drops.map((d) => (
          <li key={d.slug} className="shrink-0">
            <Link
              href="/drops"
              className="group block w-[132px]"
              aria-label={`${d.name} — ${d.percentOff}% off`}
            >
              <div className="relative aspect-[1000/1583] w-full overflow-hidden rounded-xl bg-void-2">
                <Image
                  src={d.image}
                  alt={d.alt}
                  fill
                  loading="lazy"
                  sizes="132px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="mt-2 truncate font-display text-sm font-semibold">
                {d.name}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime">
                {d.percentOff}% off
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
        Affiliate links · 21+ · check local laws
      </p>
    </section>
  );
}
