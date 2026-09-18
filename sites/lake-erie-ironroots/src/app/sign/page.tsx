import type { Metadata } from "next";
import Link from "next/link";
import { farmToday } from "@/lib/clock";
import { cuttingOn, onRegister, roomNotRunning, STANDING_LABEL } from "@/lib/crops";
import { establishedLine, FARM, formattedPhone, hasRealPhone } from "@/lib/farm";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Today's sheet",
  description:
    "A printable sheet listing what is cutting today. Press Ctrl+P or Cmd+P.",
  // A working document for the farm, not a page for search engines.
  robots: { index: false, follow: false },
};

/**
 * The sheet — the website doing work off the screen.
 *
 * The farm needs a piece of paper on the table saying what is on it today. That
 * list already exists here, computed from the same register as the home page,
 * so printing it is free and it can never disagree with the site. The
 * alternative is writing a chalkboard from memory at six in the morning.
 *
 * Designed as a printed object first:
 *   - black on white, because ink costs money
 *   - crop names large enough to read from the far side of a table
 *   - the site's own masthead and colophon are dropped by the print stylesheet,
 *     but this page keeps its OWN heading, which is the farm name and the date
 *   - one page, portrait
 *
 * Zero JavaScript, including the print step: the page names the keystroke
 * rather than shipping a button that would need a client component to call
 * window.print().
 */
export default function SignPage() {
  const today = farmToday();
  const cutting = cuttingOn(today);
  const building = roomNotRunning();
  const bench = onRegister("bench");
  const ground = onRegister("ground");

  const dateline = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="sheet band-open">
      {/* Screen-only instruction. The printed sheet does not need it. */}
      <p className="cut mb-10 text-brass print:hidden">
        Press <kbd className="text-gild">Ctrl</kbd> +{" "}
        <kbd className="text-gild">P</kbd> (or{" "}
        <kbd className="text-gild">Cmd</kbd> + <kbd className="text-gild">P</kbd>)
        to print this. &nbsp;
        <Link href="/" className="link">
          Back to the register
        </Link>
      </p>

      {/* The sheet's own masthead — kept when printing. */}
      <header className="border-b rule-lit pb-4">
        <p className="cut text-brass">{FARM.overline}</p>
        <h1 className="display text-5xl text-gild">{FARM.wordmark}</h1>
        <p className="cut mt-2 text-brass">
          {FARM.address.street}, {FARM.address.locality} &middot;{" "}
          {establishedLine()}
          {hasRealPhone() && <> &middot; {formattedPhone()}</>}
        </p>
      </header>

      <p className="cut mt-6 text-gild">{dateline}</p>

      {building ? (
        <>
          <h2 className="display mt-6 text-4xl text-gild">
            Nothing is cutting yet.
          </h2>
          <p className="prose-farm mt-4">
            The room is being built. What follows is what is going in.
          </p>
        </>
      ) : cutting.length > 0 ? (
        <>
          <h2 className="display mt-6 text-3xl text-gild">Cutting today</h2>
          <ul className="mt-4 list-none p-0">
            {cutting.map((c) => (
              <li key={c.id} className="border-b rule-hair py-2">
                <span className="display text-4xl text-gild">{c.name}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <h2 className="display mt-6 text-3xl text-gild">
          Nothing is cutting today.
        </h2>
      )}

      {/* The full register, smaller, beneath the headline list. */}
      <section className="mt-12">
        <h3 className="cut text-gild">On the bench &mdash; indoors, all year</h3>
        <ul className="mt-2 list-none p-0">
          {bench.map((e) => (
            <li key={e.id} className="border-b rule-hair flex justify-between gap-6 py-1.5">
              <span className="text-gild">{e.name}</span>
              <span className="cut text-brass">{STANDING_LABEL[e.standing]}</span>
            </li>
          ))}
        </ul>

        <h3 className="cut mt-8 text-gild">In the ground &mdash; outdoors</h3>
        <ul className="mt-2 list-none p-0">
          {ground.map((e) => (
            <li key={e.id} className="border-b rule-hair flex justify-between gap-6 py-1.5">
              <span className="text-gild">{e.name}</span>
              <span className="cut text-brass">{STANDING_LABEL[e.standing]}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="cut mt-10 text-brass">{FARM.tagline}</p>
    </div>
  );
}
