import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { LightCycle } from "@/components/light-cycle";
import { getAllGuides, getAdjacentGuides, getGuide, teaserOf, extractLinkedGuideSlugs } from "@/lib/guides";
import { strainsForGuide } from "@/lib/strains";
import { getStage } from "@/lib/stages";
import { getSessionUser } from "@/lib/session";
import { BookmarkButton } from "@/components/bookmark-button";
import { GuideNav } from "@/components/guide-nav";
import { GuideToc, GuideTocMobile } from "@/components/guide-toc";
import { ReadingProgress } from "@/components/reading-progress";
import { extractTocItems } from "@/lib/toc";

/** Prerender every guide. Gated ones still consult the session per request. */
export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const url = `${SITE}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.summary,
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url,
      type: "article",
      publishedTime: guide.updated,
      authors: ["Lake Erie Cannabis"],
      tags: [guide.stage, guide.difficulty, "cannabis", "growing"],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.summary,
    },
    alternates: { canonical: url },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  // The session is consulted ONLY for gated guides. Free guides therefore
  // touch no request-scoped API and can be prerendered and cached; the
  // bookmark control resolves its own state on the client.
  const locked = guide.membersOnly ? !(await getSessionUser()) : false;
  const body = locked ? teaserOf(guide.content) : guide.content;
  const stage = getStage(guide.stage);

  const tocItems = extractTocItems(body);
  const { prev, next } = getAdjacentGuides(guide.slug);
  const allGuides = getAllGuides();
  const linkedSlugs = extractLinkedGuideSlugs(guide.content, guide.slug);
  const relatedGuides = linkedSlugs
    .map((s) => allGuides.find((g) => g.slug === s))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const suitedStrains = strainsForGuide(guide.slug);
  const shownStrains = suitedStrains.slice(0, 8);
  const moreStrains = suitedStrains.length - shownStrains.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    dateModified: guide.updated,
    datePublished: guide.updated,
    author: { "@type": "Organization", name: "Lake Erie Cannabis", url: SITE },
    publisher: { "@type": "Organization", name: "Lake Erie Cannabis", url: SITE },
    mainEntityOfPage: `${SITE}/guides/${guide.slug}`,
    articleSection: stage?.name ?? guide.stage,
    keywords: [guide.stage, guide.difficulty, "cannabis", "growing guide"],
    wordCount: guide.content.split(/\s+/).length,
    timeRequired: `PT${guide.readMinutes}M`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
      {
        "@type": "ListItem",
        position: 3,
        name: stage?.name ?? guide.stage,
        item: `${SITE}/guides?stage=${guide.stage}`,
      },
      { "@type": "ListItem", position: 4, name: guide.title },
    ],
  };

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ReadingProgress />
      <GuideTocMobile items={tocItems} />
      <OsHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="xl:flex xl:gap-10">
        <div className="min-w-0 max-w-3xl">
        <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-frost-dim">
          <Link href="/guides" className="hover:text-frost">
            Guides
          </Link>{" "}
          /{" "}
          <Link
            href={`/guides?stage=${guide.stage}`}
            className="text-cyan hover:text-frost"
          >
            {stage?.name}
          </Link>
        </nav>

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-lime">
          <span className="whitespace-nowrap">
            {guide.week}
            {stage?.cycleLabel ? ` · ${stage.cycleLabel}` : ""}
          </span>
          <span className="whitespace-nowrap text-frost-dim">
            <span className={
              guide.difficulty === "beginner" ? "text-lime" :
              guide.difficulty === "advanced" ? "text-magenta" : "text-gold"
            }>
              {guide.difficulty}
            </span>
            {" · "}
            {guide.readMinutes} min
          </span>
          {guide.membersOnly ? (
            <span className="rounded border border-gold/50 px-1.5 py-0.5 text-[10px] text-gold">
              Members
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-frost-dim">
          {guide.summary}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          {stage?.hoursOn !== null && stage ? (
            <LightCycle hoursOn={stage.hoursOn} className="w-full max-w-xs" />
          ) : null}
          <BookmarkButton slug={guide.slug} />
        </div>

        <article className="prose-guide mt-10">
          <MDXRemote
            source={body}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
          />
        </article>

        {locked ? (
          <div className="relative mt-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-void"
            />
            <div className="glass iris-border rounded-2xl p-8 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
                Members only — membership is free
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold">
                The rest of this guide unlocks with a free account.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-frost-dim">
                No card, no spam — just a name and email, and every advanced
                guide in the library opens up.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={`/join?next=/guides/${guide.slug}`}
                  className="btn-iris rounded-full px-6 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110"
                >
                  Join free & keep reading
                </Link>
                <Link
                  href={`/login?next=/guides/${guide.slug}`}
                  className="glass-hi rounded-full px-6 py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-frost transition hover:brightness-125"
                >
                  I have an account
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {shownStrains.length > 0 ? (
          <section className="mt-12 border-t border-white/5 pt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
              Strains this applies to
            </h2>
            <p className="mt-2 text-sm text-frost-dim">
              Cultivars in our database whose grow calls for this guide.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {shownStrains.map((s) => (
                <Link
                  key={s.slug}
                  href={`/strains/${s.slug}`}
                  className="glass rounded-full px-3.5 py-1.5 text-sm text-frost transition hover:brightness-125"
                >
                  {s.name}
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-frost-dim">
                    {s.type}
                  </span>
                </Link>
              ))}
              {moreStrains > 0 ? (
                <Link
                  href="/strains"
                  className="rounded-full px-3.5 py-1.5 text-sm text-cyan underline underline-offset-2 transition hover:text-frost"
                >
                  +{moreStrains} more
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        {relatedGuides.length > 0 ? (
          <section className="mt-12 border-t border-white/5 pt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
              Related reading
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="glass group flex min-w-0 items-center justify-between gap-3 rounded-2xl p-4 transition hover:brightness-125"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">
                      {g.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                      {g.readMinutes} min read
                      {g.membersOnly ? " · members" : ""}
                    </p>
                  </div>
                  <span className="iris-text shrink-0 font-mono text-sm">→</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <GuideNav prev={prev} next={next} />

        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.14em] text-frost-dim">
          Updated{" "}
          <time dateTime={guide.updated}>
            {new Date(guide.updated + "T00:00:00").toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
          {" · "}Educational content only —{" "}
          <Link href="/legal" className="underline underline-offset-2">
            legal notice
          </Link>
        </p>
        </div>
        <aside className="w-56 shrink-0">
          <GuideToc items={tocItems} />
        </aside>
        </div>
      </main>
      <OsFooter />
    </div>
  );
}
