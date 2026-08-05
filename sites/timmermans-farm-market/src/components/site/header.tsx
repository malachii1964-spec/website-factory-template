"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { business } from "@/lib/business";
import { OpenNowBadge } from "@/components/site/open-now-badge";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/season", label: "What's in Season" },
  { href: "/visit", label: "Visit Us" },
  { href: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cream-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold italic text-barn-deep sm:text-2xl"
          onClick={() => setOpen(false)}
        >
          Timmerman&rsquo;s
          <span className="ml-2 hidden font-body not-italic text-sm font-medium tracking-wide text-espresso-soft sm:inline">
            Farm &amp; Market
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-espresso-soft transition-colors hover:text-barn-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <OpenNowBadge />
          <a
            href={business.phoneHref}
            className="inline-flex items-center gap-2 rounded-md bg-barn px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-barn-deep"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {business.phone}
          </a>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-cream-line p-2 text-espresso md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-cream-line bg-paper md:hidden">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-2 py-2 text-base font-medium text-espresso-soft hover:bg-paper-deep hover:text-barn-deep"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-cream-line px-4 py-3">
            <OpenNowBadge />
            <a
              href={business.phoneHref}
              className="inline-flex items-center gap-2 rounded-md bg-barn px-4 py-2 text-sm font-semibold text-paper"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
