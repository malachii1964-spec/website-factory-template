import { comingSoon, type Crop, justFinished, readyOn } from "@/lib/season";

/**
 * No ember bullet here. Every row in this list is ready by definition, so the
 * marker was always on and marked nothing — a dozen accent squares spending
 * the one hot colour on a distinction that did not exist, before the reader
 * ever reached the button that needs it.
 */
function CropRow({ crop }: { crop: Crop }) {
  return (
    <li className="mb-4 break-inside-avoid border-b border-[var(--hairline)] pb-4">
      <h3 className="display text-xl text-parchment md:text-2xl">{crop.name}</h3>
      <p className="mt-1 text-sm text-iron">{crop.note}</p>
    </li>
  );
}

/**
 * What is actually on the table this week.
 *
 * LAYOUT, and why it is not a two-column grid any more. It used to be
 * `[1.3fr_1fr]` with the crop list on the left and a short "next three weeks /
 * just finished" block on the right, made `sticky` to fill the space. Today
 * that right cell holds four lines of grey text, so the reader scrolled 1,400
 * pixels of crop list while two frozen words followed them down — a dead
 * half-page that was worse for being pinned.
 *
 * Now the list takes the full measure and flows into columns, and the two
 * short lists sit underneath in a row where their length is appropriate.
 *
 * The empty state is designed rather than hidden: out of season the farm has
 * nothing to sell, and saying so plainly is more trustworthy than an evergreen
 * page that implies tomatoes in January.
 */
export function ReadyNow({ today }: { today: Date }) {
  const ready = readyOn(today);
  const soon = comingSoon(today, 21);
  const finished = justFinished(today, 14);

  return (
    <div>
      {ready.length > 0 ? (
        <>
          <h2 className="display h-section">
            Ready at the stand
            <span className="block text-ember">this week</span>
          </h2>
          {/* CSS columns rather than a grid: the rows are different heights
              and `break-inside-avoid` keeps each crop whole. */}
          <ul className="mt-10 list-none p-0 sm:columns-2 sm:gap-x-12 lg:columns-3 lg:gap-x-14">
            {ready.map((c) => (
              <CropRow key={c.id} crop={c} />
            ))}
          </ul>
        </>
      ) : (
        <>
          <h2 className="display h-section">
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

      {(soon.length > 0 || finished.length > 0) && (
        <div className="mt-10 grid gap-8 border-t border-[var(--hairline)] pt-8 sm:grid-cols-2 sm:gap-14">
          {soon.length > 0 && (
            <section className="min-w-0">
              <h3 className="label">Next three weeks</h3>
              <p className="mt-3 text-sm text-parchment/80">
                {soon.map((c) => c.name).join(" · ")}
              </p>
            </section>
          )}

          {finished.length > 0 && (
            <section className="min-w-0">
              <h3 className="label text-iron">Just finished</h3>
              <p className="mt-3 text-sm text-iron">
                {finished.map((c) => c.name).join(" · ")}
              </p>
              <p className="mt-2 text-xs text-iron">
                Gone for the year. We would rather say so than sell you
                something picked green.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
