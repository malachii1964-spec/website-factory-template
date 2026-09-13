import { comingSoon, type Crop, justFinished, readyOn } from "@/lib/season";

function CropRow({ crop, live }: { crop: Crop; live: boolean }) {
  return (
    <li className="border-b border-[var(--hairline)] py-4 last:border-0">
      <div className="flex items-baseline gap-3">
        {live && (
          <span
            aria-hidden="true"
            className="mt-[0.35rem] inline-block size-[7px] shrink-0 bg-ember"
          />
        )}
        <h3
          className={`display text-xl md:text-2xl ${
            live ? "text-parchment" : "text-iron"
          }`}
        >
          {crop.name}
        </h3>
      </div>
      <p className="mt-1 pl-0 text-sm text-iron md:pl-[1.1rem]">{crop.note}</p>
    </li>
  );
}

/**
 * What is actually on the table this week.
 *
 * The empty state is designed rather than hidden: out of season the farm has
 * nothing to sell, and saying so plainly is more trustworthy than an
 * evergreen page that implies tomatoes in January.
 */
export function ReadyNow({ today }: { today: Date }) {
  const ready = readyOn(today);
  const soon = comingSoon(today, 21);
  const finished = justFinished(today, 14);

  return (
    <div className="grid gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
      <div className="min-w-0">
        {ready.length > 0 ? (
          <>
            <h2 className="display text-3xl md:text-5xl">
              Ready at the stand
              <span className="block text-ember">this week</span>
            </h2>
            <ul className="mt-8 list-none p-0">
              {ready.map((c) => (
                <CropRow key={c.id} crop={c} live />
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 className="display text-3xl md:text-5xl">
              The stand is closed
              <span className="block text-iron">until the ground thaws</span>
            </h2>
            <p className="prose-farm mt-6 text-iron">
              Nothing is ripe on the lake plain right now, so there is nothing
              worth selling you. Asparagus is the first thing back, usually the
              first week of May.
            </p>
          </>
        )}
      </div>

      {/* Sticky beside the list: the crop list runs long and this column is
          short, which otherwise leaves a dead half-page of nothing next to it.
          Travelling with the reader also keeps "what is next" in view while
          they read what is here now. */}
      <div className="min-w-0 space-y-10 md:sticky md:top-24 md:self-start">
        {soon.length > 0 && (
          <section>
            <h3 className="label">Next three weeks</h3>
            <ul className="mt-4 list-none space-y-2 p-0 text-sm">
              {soon.map((c) => (
                <li key={c.id} className="text-parchment/80">
                  {c.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {finished.length > 0 && (
          <section>
            <h3 className="label text-iron">Just finished</h3>
            <ul className="mt-4 list-none space-y-2 p-0 text-sm">
              {finished.map((c) => (
                <li key={c.id} className="text-iron">
                  {c.name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-iron">
              Gone for the year. We would rather say so than sell you something
              picked green.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
