import { SignupForm } from "./signup-form";

/**
 * One page, one job: get an email from a grower who wants to know when there
 * are cuttings. Everything else on it exists to make that ask credible.
 *
 * Nothing is for sale here and nothing is priced. The licensing position is
 * unresolved, so a page that promised product would be writing a cheque the
 * business cannot yet cash.
 */

/** The tag fields. Real data — a label that lies is just decoration. */
const TAG_FIELDS: [string, string][] = [
  ["Location", "Chautauqua County, NY"],
  ["Latitude", "42° N — Lake Erie shoreline"],
  ["Hardiness", "USDA zone 6a–6b"],
  ["Belt", "Lake-effect / Concord grape"],
];

const NOTES: { field: string; heading: string; body: string }[] = [
  {
    field: "Cuttings",
    heading: "Rooted clones, not mystery seed",
    body: "Cuttings taken from mothers that have already been through a season here — so what you plant has a record behind it instead of a promise.",
  },
  {
    field: "Breeding",
    heading: "Crosses made for a short, wet autumn",
    body: "Selection runs on finish date and mould resistance before anything else. A plant that rots in the second week of October is not a good plant, whatever else it does.",
  },
  {
    field: "Notes",
    heading: "What worked, written down",
    body: "Medium, feed, timing and what went wrong, published as we go. The grape growers here have shared notes for a century; there is no reason this should be different.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
      {/* ---------------------------------------------------------- masthead */}
      <header className="flex items-baseline justify-between gap-4 border-b border-haze/15 py-6">
        <p className="field-label tracking-[0.28em] text-limestone">Lake Erie Cannabis</p>
        <p className="field-label text-haze/75">Est. Chautauqua County</p>
      </header>

      {/* ------------------------------------------------------------- hero */}
      <section className="grid items-center gap-12 py-16 sm:py-24 md:grid-cols-[1fr_auto] md:gap-16">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-limestone sm:text-6xl">
            Genetics bred for
            <span className="block text-amber">the lake-effect belt.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze sm:text-xl">
            The lake keeps this shoreline warmer in October than the land ten miles
            south of it. That is why the grapes are here. We are breeding cannabis
            for the same narrow, generous window — and giving Western New York
            growers cuttings that already know the weather.
          </p>

          <div className="mt-10 max-w-xl">
            <p className="field-label mb-3 text-haze/75">Get told when cuttings are ready</p>
            <SignupForm />
            <p className="mt-3 text-sm text-haze/70">
              Nothing is for sale on this page. One email when there is something
              real to say, and nothing in between.
            </p>
          </div>
        </div>

        {/* THE SIGNATURE — the breeder's tag you tie to a branch. Used once. */}
        <div className="tag-sway relative w-full max-w-[19rem] shrink-0 justify-self-center md:justify-self-end">
          <div className="rounded-sm border border-haze/25 bg-shallows/70 p-6 pt-9 shadow-2xl shadow-black/40">
            <div
              className="tag-hole absolute left-1/2 top-3 h-3 w-14 -translate-x-1/2 rounded-full bg-haze/25"
              aria-hidden="true"
            />
            <p className="field-label text-amber">Field tag</p>
            <p className="mt-2 font-display text-2xl font-extrabold leading-tight text-limestone">
              Lake Erie
              <br />
              Cannabis
            </p>
            <dl className="mt-6 space-y-3 border-t border-haze/15 pt-5">
              {TAG_FIELDS.map(([label, value]) => (
                <div key={label}>
                  <dt className="field-label text-haze/75">{label}</dt>
                  <dd className="mt-0.5 text-sm text-limestone">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="field-label text-haze/75">Status</dt>
                <dd className="mt-0.5 text-sm text-living">Building stock — not yet selling</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ notes */}
      <section className="border-t border-haze/15 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-limestone sm:text-3xl">
          What we are actually doing
        </h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {NOTES.map((note) => (
            <article key={note.field}>
              <p className="field-label text-amber">{note.field}</p>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-limestone">
                {note.heading}
              </h3>
              <p className="mt-3 leading-relaxed text-haze">{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- honest */}
      <section className="rounded-sm border border-haze/20 bg-shallows/40 p-6 sm:p-8">
        <p className="field-label text-amber">Where this stands</p>
        <p className="mt-3 max-w-3xl leading-relaxed text-haze">
          Lake Erie Cannabis is being built in the open. There is no storefront,
          no price list and no stock to ship today, and this page will say so
          plainly until that changes. New York&rsquo;s rules decide what can be
          sold and to whom, and we would rather move slowly than promise something
          we are not yet licensed to hand over.
        </p>
      </section>

      <footer className="mt-16 flex flex-col gap-3 border-t border-haze/15 pt-6 text-sm text-haze/70 sm:flex-row sm:items-center sm:justify-between">
        <p>Lake Erie Cannabis · Chautauqua County, New York</p>
        <p>For adults 21+. Nothing here is an offer to sell.</p>
      </footer>
    </main>
  );
}
