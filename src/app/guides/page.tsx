import type { Metadata } from "next";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { GuideCard } from "@/components/guide-card";
import { GuideBrowser } from "@/components/guide-browser";
import { getAllGuides } from "@/lib/guides";
import { STAGES } from "@/lib/stages";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export const metadata: Metadata = {
  title: "Grow Guides",
  description:
    "Stage-by-stage cannabis cultivation guides — germination, veg, flower, harvest, cure, and troubleshooting.",
  openGraph: {
    title: "Grow Guides",
    description:
      "Stage-by-stage cannabis cultivation guides — germination, veg, flower, harvest, cure, and troubleshooting.",
    url: `${SITE}/guides`,
  },
  alternates: { canonical: `${SITE}/guides` },
};

/**
 * The library index is the same for everyone — guide metadata is public and
 * nothing here depends on the session — so it is rendered once at build time
 * and cached, rather than re-rendered per request. Filtering happens on the
 * client (GuideBrowser) over cards that were still rendered on the server.
 */
export default function GuidesPage() {
  const guides = getAllGuides();

  const cards = Object.fromEntries(
    guides.map((g) => [g.slug, <GuideCard key={g.slug} guide={g} />]),
  );

  const stageHeadings = Object.fromEntries(
    STAGES.map((s) => [
      s.id,
      <div key={s.id}>
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl font-semibold text-frost">
            {s.name}
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-frost-dim">
            {s.weeks} · {guides.filter((g) => g.stage === s.id).length} guides
          </span>
        </div>
        <p className="mt-1 text-sm text-frost-dim">{s.blurb}</p>
      </div>,
    ]),
  );

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
          The almanac
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          Grow guides
        </h1>

        <GuideBrowser
          guides={guides}
          cards={cards}
          stageHeadings={stageHeadings}
        />
      </main>
      <OsFooter />
    </div>
  );
}
