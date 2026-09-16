import type { Metadata } from "next";
import Link from "next/link";
import { farmToday } from "@/lib/clock";
import {
  establishedLine,
  FARM,
  formattedPhone,
  hasRealPhone,
} from "@/lib/farm";
import { comingSoon, readyOn } from "@/lib/season";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Stand sign",
  description:
    "A printable sign listing what is ready at the stand today. Press Ctrl+P.",
  // A working document for the farm, not a page for search engines.
  robots: { index: false, follow: false },
};

/**
 * The stand sign — the website doing work off the screen.
 *
 * A farm stand needs a piece of paper on the table saying what is on it today.
 * That list already exists here, computed from the same season data as the
 * home page, so printing it is free and it can never disagree with the site.
 * The alternative is the farmer writing a chalkboard from memory at 6am.
 *
 * Designed as a printed object first:
 *   - black on white, gold reduced to two hairlines, because ink costs money
 *   - crop names at ~28pt so they read from the far side of a table
 *   - the site's chrome (header, footer, the root line) is dropped from the
 *     printed page; nobody wants a nav bar on a sign
 *   - one page, portrait, with the date large enough to prove it is today's
 *
 * Zero JavaScript, including the print step: the page tells you the keystroke
 * rather than shipping a button that needs a client component to call
 * window.print().
 */
export default function SignPage() {
  const today = farmToday();
  const ready = readyOn(today);
  const soon = comingSoon(today, 14);

  const dateLine = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8">
      {/* Screen-only instructions. Never printed. */}
      <div className="print:hidden">
        <p className="label">For the stand</p>
        <h1 className="display mt-4 text-3xl md:text-5xl">
          Today&rsquo;s sign, ready to print
        </h1>
        <p className="prose-farm mt-5">
          This is the same list as the website, so it cannot disagree with it.
          Print it in the morning and put it on the table.
        </p>
        <p className="mt-6 text-sm text-iron">
          Press <kbd className="text-parchment">Ctrl</kbd> +{" "}
          <kbd className="text-parchment">P</kbd> (or{" "}
          <kbd className="text-parchment">⌘</kbd> +{" "}
          <kbd className="text-parchment">P</kbd> on a Mac). Choose{" "}
          <strong className="text-parchment">portrait</strong>. Everything below
          the line prints; nothing above it does.
        </p>
        <Link
          href="/"
          className="label mt-8 inline-block text-gold transition-colors hover:text-gold-lit"
        >
          &larr; Back to the site
        </Link>
        <hr className="mt-10 border-0 border-t border-[var(--hairline)]" />
      </div>

      {/*
        The sign itself. `.sign` carries the print palette so the screen
        preview looks exactly like the paper, rather than being a dark page
        that prints as something the farmer has not seen.
      */}
      <article className="sign mt-10 print:mt-0">
        <header className="sign-head">
          <p className="sign-overline">{FARM.overline}</p>
          <p className="sign-wordmark">{FARM.wordmark}</p>
          <p className="sign-tagline">{FARM.tagline}</p>
        </header>

        <p className="sign-date">{dateLine}</p>

        <h2 className="sign-h2">Picked today</h2>

        {ready.length > 0 ? (
          <ul className="sign-list">
            {ready.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <p className="sign-empty">
            Nothing is ripe yet. The stand opens again in {FARM.openSeason.from}.
          </p>
        )}

        {soon.length > 0 && (
          <p className="sign-soon">
            <span>Coming in the next fortnight:</span> {soon.map((c) => c.name).join(" · ")}
          </p>
        )}

        <footer className="sign-foot">
          <span>
            {FARM.address.street}, {FARM.address.locality} {FARM.address.region}
          </span>
          {/* Somebody will photograph this sign. Give them a way to call. */}
          {hasRealPhone() && <span>{formattedPhone()}</span>}
          <span>{establishedLine()}</span>
        </footer>
      </article>
    </div>
  );
}
