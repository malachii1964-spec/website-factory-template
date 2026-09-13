import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { FARM, formattedPhone, hasRealPhone } from "@/lib/farm";

const NAV = [
  { href: "/#ready", label: "What's ready" },
  { href: "/#farm", label: "The farm" },
  { href: "/visit", label: "Visit" },
];

/**
 * Solid, not translucent. A backdrop-filter here would cost GPU on every
 * scrolled frame for an effect nobody notices behind a near-black bar.
 *
 * The background is fully opaque for the same reason: at 95% the page text
 * underneath bled through the bar as it scrolled past, which reads as a
 * rendering fault rather than as glass.
 */
export function SiteHeader() {
  const phone = hasRealPhone();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-pier">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 md:px-8">
        <Link href="/" aria-label={`${FARM.name} — home`}>
          <Wordmark />
        </Link>

        {/* The nav was hidden below 640px, which left a two-page site with no
            way to reach its second page on the device most of its customers
            use. Three links fit; they wrap. */}
        <nav className="flex items-center gap-4 md:gap-7">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label text-[0.625rem] transition-colors hover:text-gold-lit md:text-[0.6875rem]"
            >
              {item.label}
            </Link>
          ))}
          {/* A button that dials 000-0000 is worse than no button. */}
          {phone && (
            <a
              href={`tel:${FARM.phone}`}
              className="label border border-[var(--hairline)] px-3 py-2 text-gold-lit transition-colors hover:border-gold hover:bg-shale"
            >
              <span className="sm:hidden">Call</span>
              <span className="hidden sm:inline">{formattedPhone()}</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
