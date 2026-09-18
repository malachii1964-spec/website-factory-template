import Link from "next/link";
import { FARM, establishedLine } from "@/lib/farm";

/**
 * The masthead of a printed sheet, not a navigation bar.
 *
 * It does not stick. A sticky rail that follows you down a document is a web
 * app convention, and this is a document — the masthead sits at the top of the
 * page the way it sits at the top of a bulletin, and then the record starts.
 *
 * There is no logo image here and no gradient on the wordmark. The wordmark is
 * set in the page's own serif, which is what makes the type carry the identity
 * rather than an asset doing it.
 */
export function Masthead() {
  return (
    <header className="sheet band-masthead">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 rule-head pb-4">
        <div>
          <Link
            href="/"
            className="block no-underline focus-visible:outline-2"
            aria-label={`${FARM.name} — home`}
          >
            <span className="fig block text-ink-2">{FARM.overline}</span>
            <span className="display block text-4xl text-ink md:text-5xl">
              {FARM.wordmark}
            </span>
          </Link>
        </div>

        <div className="flex flex-col items-start gap-1 md:items-end">
          <p className="fig text-ink-2">
            {FARM.address.locality}, {FARM.state} &middot; {establishedLine()}
          </p>
          <nav aria-label="Sections">
            <ul className="flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
              <li>
                <Link href="/" className="link">
                  The record
                </Link>
              </li>
              <li>
                <Link href="/visit" className="link">
                  Visit
                </Link>
              </li>
              <li>
                <Link href="/sign" className="link">
                  Print the sheet
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <p className="fig mt-3 text-ink-2">{FARM.tagline}</p>
    </header>
  );
}
