import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?category=prompts", label: "Prompt libraries" },
      { href: "/products?category=ebooks", label: "E-books & guides" },
      { href: "/products?category=courses", label: "Courses" },
      { href: "/local-business", label: "Local business kits" },
      { href: "/free-toolkit", label: "Free starter prompts" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Malachi" },
      { href: "/membership", label: "Inner Circle" },
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
            AI tools that do the work — prompt packs, templates, industry
            automation kits, and courses. Buy once, download instantly, get
            results today.
          </p>
          <p className="readout mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot" aria-hidden />
            All systems operational
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow eyebrow-muted mb-4">{col.title}</h3>
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
          <p>© {year} FutureDeskAI. All rights reserved.</p>
          <p className="readout">Built to be owned — not rented.</p>
        </div>
      </div>
    </footer>
  );
}
