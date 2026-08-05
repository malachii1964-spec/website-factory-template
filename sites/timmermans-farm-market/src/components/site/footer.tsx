import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { business, hoursDisplay, seasonDisplay } from "@/lib/business";

export function Footer() {
  return (
    <footer className="border-t border-cream-line bg-espresso text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl italic text-peach">Timmerman&rsquo;s Farm &amp; Market</p>
          <p className="mt-3 max-w-xs text-sm text-paper/70">
            Family-run on Route 20 in Westfield, New York, for more than four
            decades. Come say hello.
          </p>
        </div>

        <div className="text-sm">
          <p className="font-semibold text-paper">Visit</p>
          <p className="mt-3 flex items-start gap-2 text-paper/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {business.addressLine}
          </p>
          <a
            href={business.phoneHref}
            className="mt-2 flex items-center gap-2 text-paper/80 hover:text-peach"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            {business.phone}
          </a>
          <p className="mt-4 text-paper/70">{hoursDisplay}</p>
          <p className="text-paper/70">{seasonDisplay}</p>
        </div>

        <div className="text-sm">
          <p className="font-semibold text-paper">Around the site</p>
          <ul className="mt-3 space-y-2 text-paper/80">
            <li><Link href="/about" className="hover:text-peach">About Us</Link></li>
            <li><Link href="/season" className="hover:text-peach">What&rsquo;s in Season</Link></li>
            <li><Link href="/visit" className="hover:text-peach">Visit Us</Link></li>
            <li><Link href="/contact" className="hover:text-peach">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10 px-4 py-4 text-center text-xs text-paper/50 sm:px-6">
        &copy; {new Date().getFullYear()} Timmerman&rsquo;s Farm and Market, Westfield, NY.
      </div>
    </footer>
  );
}
