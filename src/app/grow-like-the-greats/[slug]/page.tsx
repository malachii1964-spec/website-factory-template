import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { GROWERS, getGrower } from "@/lib/growers";
import { getAllGuides } from "@/lib/guides";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

/**
 * Growers that have a hand-built page of their own. The static route wins at
 * request time, but we must not ALSO prerender it here or two builds fight
 * over the same output path.
 */
const BESPOKE = new Set(["mr-canucks-grow"]);

export function generateStaticParams() {
  return GROWERS.filter((g) => !BESPOKE.has(g.slug)).map((g) => ({
    slug: g.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGrower(slug);
  if (!g) return {};
  return {
    title: `Grow Like ${g.name} — ${g.role}`,
    description: g.tagline,
    openGraph: {
      title: `Grow Like ${g.name} — ${g.role}`,
      description: g.tagline,
      url: `${SITE}/grow-like-the-greats/${slug}`,
    },
    alternates: { canonical: `${SITE}/grow-like-the-greats/${slug}` },
  };
}

export default async function GrowerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGrower(slug);
  if (!g) notFound();

  const allGuides = getAllGuides();
  const guides = g.guideSlugs
    .map((s) => allGuides.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-frost-dim">
          <Link href="/grow-like-the-greats" className="hover:text-frost">
            Grow Like the Greats
          </Link>{" "}
          / <span className="text-gold">{g.role}</span>
        </nav>

        <h1 className="display-xl mt-4">Grow like {g.name}</h1>
        <p className="mt-4 text-lg leading-relaxed text-frost-dim">{g.tagline}</p>

        {/* known for */}
        <div className="mt-6 flex flex-wrap gap-2">
          {g.knownFor.map((k) => (
            <span
              key={k}
              className="rounded-full bg-gradient-to-r from-gold/15 to-violet/15 px-3 py-1.5 text-sm text-frost"
            >
              {k}
            </span>
          ))}
        </div>

        {/* the method */}
        <div className="glass iris-border mt-8 rounded-3xl p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
            The method
          </h2>
          <p className="mt-3 leading-relaxed text-frost-dim">{g.method}</p>
        </div>

        {/* lessons */}
        <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
          What to take from {g.name.split(" ")[0]}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {g.lessons.map((l) => (
            <div key={l.t} className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg font-semibold">{l.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-frost-dim">
                {l.d}
              </p>
            </div>
          ))}
        </div>

        {/* grow like them — steps */}
        <div className="glass iris-border mt-10 rounded-3xl p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
            Grow like {g.name.split(" ")[0]} — the simple path
          </h2>
          <ol className="mt-4 space-y-3">
            {g.steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="iris-text font-display text-lg font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-frost-dim">
                  {s}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* guides that put it into practice */}
        {guides.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
              Guides that put this into practice
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="glass group flex min-w-0 items-center justify-between gap-3 rounded-2xl p-4 transition hover:brightness-125"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">
                      {guide.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                      {guide.readMinutes} min read
                      {guide.membersOnly ? " · members" : ""}
                    </p>
                  </div>
                  <span className="iris-text shrink-0 font-mono text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {g.external ? (
          <p className="mt-8 text-sm text-frost-dim">
            Explore their own work:{" "}
            <a
              href={g.external.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan underline underline-offset-2"
            >
              {g.external.label}
            </a>
          </p>
        ) : null}

        <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-[12px] leading-relaxed text-frost-dim">
          Educational profile of publicly shared methods. Lake Erie Cannabis is
          not affiliated with, sponsored by, or endorsed by {g.name}. All
          trademarks belong to their owners.{" "}
          <Link
            href="/grow-like-the-greats"
            className="underline underline-offset-2"
          >
            All growers
          </Link>
        </p>
      </main>
      <OsFooter />
    </div>
  );
}
