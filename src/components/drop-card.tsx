import Image from "next/image";
import Link from "next/link";
import { PromoCode } from "@/components/promo-code";
import { AFFILIATE_URL, type Drop, hasAffiliateLink } from "@/lib/promos";

/**
 * One limited drop. The art carries the selling; the text layer underneath
 * exists because words baked into an image are invisible to screen readers and
 * search engines, and a code inside a JPEG cannot be copied.
 *
 * `priority` should be set on the first card only — the rest lazy-load.
 */
export function DropCard({
  drop,
  priority = false,
}: {
  drop: Drop;
  priority?: boolean;
}) {
  return (
    <article className="glass group flex min-w-0 flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[1000/1583] w-full overflow-hidden bg-void-2">
        <Image
          src={drop.image}
          alt={drop.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 92vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-frost-dim">
            Drop {String(drop.number).padStart(2, "0")} · {drop.breeder}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold leading-tight">
            {drop.name}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan">
            {drop.edition}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-frost-dim">
            {drop.notes}
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-1">
          <p className="font-display text-2xl font-semibold text-frost">
            {drop.percentOff}% off
          </p>

          <PromoCode code={drop.code} label={drop.name} />

          {hasAffiliateLink() ? (
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="btn-iris inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              Shop this drop →
            </a>
          ) : null}

          {drop.relatedStrainSlugs?.length ? (
            <p className="text-xs leading-relaxed text-frost-dim">
              Related genetics on this site:{" "}
              {drop.relatedStrainSlugs.map((s, i) => (
                <span key={s}>
                  {i > 0 ? ", " : ""}
                  <Link
                    href={`/strains/${s}`}
                    className="text-cyan underline underline-offset-2"
                  >
                    {s.replace(/-/g, " ")}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
