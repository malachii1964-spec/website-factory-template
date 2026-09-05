import Link from "next/link";

const NAV_COLS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Grow",
      links: [
        { label: "Start Here", href: "/start" },
        { label: "Knowledge OS", href: "/guides" },
        { label: "Build My Grow", href: "/build-my-grow" },
        { label: "Grow Like the Greats", href: "/grow-like-the-greats" },
      ],
    },
    {
      heading: "Genetics",
      links: [
        { label: "Strains", href: "/strains" },
        { label: "Strain Finder", href: "/strain-finder" },
        { label: "Terpenes", href: "/terpenes" },
        { label: "Seeds & Breeders", href: "/seeds" },
      { label: "Limited Drops", href: "/drops" },
      ],
    },
    {
      heading: "Tools",
      links: [
        { label: "Grow Tools", href: "/tools" },
        { label: "Visual Diagnose", href: "/diagnose" },
        { label: "AI Plant Doctor", href: "/plant-doctor" },
        { label: "Soil Lab", href: "/frostybuds-soil" },
      ],
    },
    {
      heading: "More",
      links: [
        { label: "Recipes", href: "/recipes" },
        { label: "Gear Index", href: "/gear" },
        { label: "Local NY", href: "/local-ny" },
        { label: "Medical Card", href: "/medical-card" },
      ],
    },
  ];

export function OsFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-display text-lg font-semibold">
              Lake Erie <span className="iris-text">Cannabis</span>
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-frost-dim">
              Rooted in excellence
            </p>
            <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-frost-dim">
              The grower&apos;s almanac for home cannabis cultivation — indoor
              and outdoor. Educational content only.
            </p>
          </div>
          {NAV_COLS.map((col) => (
            <nav key={col.heading} className="flex flex-col gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan">
                {col.heading}
              </p>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-frost-dim transition hover:text-frost"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-frost-dim sm:text-left">
            Built for education. Designed for wellness.
          </p>
          <div className="flex gap-4 text-[11px] text-frost-dim">
            <Link href="/join" className="transition hover:text-frost">
              Join free
            </Link>
            <Link href="/faq" className="transition hover:text-frost">
              FAQ
            </Link>
            <Link href="/legal" className="transition hover:text-frost">
              Legal
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-[10px] leading-relaxed text-frost-dim sm:text-left">
          Cannabis laws vary by state and country — know your local regulations.
          Not legal or medical advice. 21+ only. © Lake Erie Cannabis.
        </p>
      </div>
    </footer>
  );
}
