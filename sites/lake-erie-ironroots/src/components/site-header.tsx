import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { FARM, formattedPhone } from "@/lib/farm";

const NAV = [
  { href: "/#ready", label: "What's ready" },
  { href: "/#farm", label: "The farm" },
  { href: "/visit", label: "Visit" },
];

/**
 * Solid, not translucent. A backdrop-filter here would cost GPU on every
 * scrolled frame for an effect nobody notices behind a near-black bar.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-pier/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href="/" aria-label={`${FARM.name} — home`}>
          <Wordmark />
        </Link>

        <nav className="flex items-center gap-5 md:gap-7">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label hidden transition-colors hover:text-gold-lit sm:block"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${FARM.phone}`}
            className="label border border-[var(--hairline)] px-3 py-2 text-gold-lit transition-colors hover:border-gold hover:bg-shale"
          >
            <span className="sm:hidden">Call</span>
            <span className="hidden sm:inline">{formattedPhone()}</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
