import Link from "next/link";
import { FARM } from "@/lib/farm";

/**
 * The masthead floats over the page rather than sitting above it.
 *
 * On the front door the hero fills the viewport, and a bar stacked on top of it
 * would break the one thing that page is for — you are meant to land inside the
 * scene, not look at a picture pinned under a navigation strip. So the header
 * is absolutely positioned over the top of the document, on the sky, where
 * there is nothing to obscure.
 *
 * Inner pages clear it with the top padding already built into `.band-open`,
 * which is why that padding is large.
 *
 * The name is set in live type rather than the wordmark image here: the plate's
 * bevelled lockup is enormous a few hundred pixels below, and repeating it at
 * thumbnail size would only compete with it.
 */
export function Masthead() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      {/*
        Column on a phone, row from tablet up.

        As a row at 390px the three tracked labels wrapped onto a second line
        and ran into the wordmark beside them. Stacking is better than shrinking
        the tracking, which is what carries the plate's voice in this type.
      */}
      <div className="sheet flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-6 md:py-8">
        <Link
          href="/"
          className="group no-underline"
          aria-label={`${FARM.name} — home`}
        >
          <span className="cut block text-stone transition-colors group-hover:text-gold">
            {FARM.overline}
          </span>
          <span className="display mt-1 block text-lg text-gild md:text-xl">
            {FARM.wordmark}
          </span>
        </Link>

        <nav aria-label="Sections">
          <ul className="flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0 sm:justify-end sm:gap-x-6 md:gap-x-9">
            {[
              ["/#register", "The register"],
              ["/visit", "Visit"],
              ["/sign", "Today's sheet"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="cut text-gold/80 no-underline transition-colors hover:text-glow focus-visible:text-glow"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
