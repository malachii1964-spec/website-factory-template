import Link from "next/link";
import { Phone, MapPin, Clock } from "lucide-react";
import { Logo } from "./Logo";
import { OpenStatus } from "./OpenStatus";
import { site, addressOneLine, nav } from "@/lib/site";
import { weeklyHoursRows } from "@/lib/hours";

export function Footer() {
  const rows = weeklyHoursRows();
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;

  return (
    <footer className="mt-24 bg-fir text-paper/80">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-3">
        <div>
          <div className="text-paper">
            <Logo />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">{site.description}</p>
          <div className="mt-5">
            <OpenStatus className="text-paper/90" />
          </div>
        </div>

        <div>
          <h3 className="eyebrow text-grow">Visit the greenhouses</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-3 hover:text-grow">
                <MapPin size={17} className="mt-0.5 shrink-0 text-grow" aria-hidden />
                <span>{addressOneLine}</span>
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="inline-flex items-center gap-3 hover:text-grow">
                <Phone size={17} className="shrink-0 text-grow" aria-hidden />
                <span>{site.phone}</span>
              </a>
            </li>
          </ul>
          <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-grow">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="eyebrow text-grow">
            <Clock size={14} aria-hidden /> Hours
          </h3>
          <dl className="mt-4 space-y-1.5 text-sm">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between gap-4">
                <dt className="text-paper/70">{r.label}</dt>
                <dd className="tabular-nums">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-paper/50 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} {site.legalName}. Grown in Lakewood, New York.</p>
          <p>Family-owned since {site.founded}.</p>
        </div>
      </div>
    </footer>
  );
}
