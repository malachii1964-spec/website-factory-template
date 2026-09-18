import {
  cycleLine,
  type Entry,
  onRegister,
  type Register,
  registerLine,
  STANDING_LABEL,
  windowLine,
} from "@/lib/crops";

/**
 * The record. This is the signature of the whole site.
 *
 * It is a real <table> with a caption and scoped headers, because the reader's
 * job here is to look up a row — "is there anything I can get this week" — and
 * a table is the correct instrument for that. The build this replaced rendered
 * the same information as a horizontal Gantt chart with a today-marker, which
 * looked like a project-management dashboard and could not be read by anyone
 * who wanted one fact.
 *
 * Reflow rather than horizontal scroll: three columns at every width, with each
 * crop's note living inside its name cell so nothing has to be dropped on a
 * phone. Table semantics survive because no display:block is applied to the
 * table's own parts.
 *
 * Standing is stated in words in its own column as well as being set in red, so
 * nothing is communicated by colour alone.
 */

function Rhythm({ entry }: { entry: Entry }) {
  if (entry.cycle) return <>{cycleLine(entry.cycle)}</>;
  if (entry.window) return <>{windowLine(entry.window)}</>;
  return null;
}

function Rows({ entries }: { entries: Entry[] }) {
  return (
    <>
      {entries.map((e) => {
        const cutting = e.standing === "cutting";
        return (
          <tr key={e.id} className="border-b rule-hair align-baseline">
            <th scope="row" className="py-5 pr-4 text-left align-top font-normal">
              <span
                className={`display text-base tracking-wide ${cutting ? "text-ember" : "text-gild"}`}
              >
                {e.name}
              </span>
              {e.varieties.length > 0 && (
                <span className="cut mt-1 block text-stone">
                  {e.varieties.join(", ")}
                </span>
              )}
              <span className="mt-2 block max-w-[42ch] text-sm leading-relaxed text-brass">
                {e.note}
              </span>
            </th>
            <td
              className={`cut py-5 pr-4 ${
                cutting ? "text-ember" : "text-stone"
              }`}
            >
              {STANDING_LABEL[e.standing]}
            </td>
            <td className="cut py-5 text-brass">
              <Rhythm entry={e} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function RegisterTable({
  register,
  date,
  heading,
}: {
  register: Register;
  date: Date;
  heading: string;
}) {
  const entries = onRegister(register);
  if (entries.length === 0) return null;

  return (
    <section className="mt-20 first:mt-0">
      <h2 className="display text-2xl text-gild md:text-3xl">{heading}</h2>
      <p className="prose-farm mt-3 text-sm">{registerLine(register, date)}</p>

      <table className="mt-7 w-full border-collapse text-left">
        <caption className="sr-only">
          {heading} — what is growing, its standing, and its rhythm.
        </caption>
        <thead>
          <tr className="border-b rule-lit">
            <th scope="col" className="cut pb-3 pr-4 text-gold">
              Crop
            </th>
            <th scope="col" className="cut pb-3 pr-4 text-gold">
              Standing
            </th>
            <th scope="col" className="cut pb-3 text-gold">
              {register === "bench" ? "Rhythm" : "Window"}
            </th>
          </tr>
        </thead>
        <tbody>
          <Rows entries={entries} />
        </tbody>
      </table>
    </section>
  );
}
