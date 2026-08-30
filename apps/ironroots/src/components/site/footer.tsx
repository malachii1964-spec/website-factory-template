import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All produce" },
      { href: "/shop?category=leafy-greens", label: "Leafy greens" },
      { href: "/shop?category=seasonal-boxes", label: "Harvest boxes" },
      { href: "/csa", label: "Weekly CSA subscription" },
    ],
  },
  {
    title: "Farm",
    links: [
      { href: "/about", label: "Our farm" },
      { href: "/contact", label: "Contact" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Growing the best-tasting, healthiest vegetables we can, year-round,
            for our own county — on the shore of Lake Erie.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow mb-4">{col.title}</h3>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} Lake Erie IronRoots. All rights reserved.</p>
          <p>Local. Year-round. Grown, not shipped.</p>
        </div>
      </div>
    </footer>
  );
}
