import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All produce" },
      { href: "/shop?category=leafy-greens", label: "Leafy greens" },
      { href: "/shop?category=seedlings-starts", label: "Seedlings & starts" },
      { href: "/csa", label: "Weekly CSA subscription" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/community", label: "Making it affordable" },
      { href: "/growing-guides", label: "Learn to grow" },
      { href: "/about", label: "Our farm" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Organic vegetables, grown vigorously, priced so a low-income
            family can actually afford them — on the shore of Lake Erie.
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
          <p>Local. Organic. Priced for everyone.</p>
        </div>
      </div>
    </footer>
  );
}
