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
          <tr key={e.id} className="rule-row align-baseline">
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <span
                className={`display text-lg ${cutting ? "text-iron" : "text-ink"}`}
              >
                {e.name}
              </span>
              {e.varieties.length > 0 && (
                <span className="fig block text-ink-2">
                  {e.varieties.join(", ")}
                </span>
              )}
              <span className="mt-1 block max-w-[38ch] text-sm text-ink-2">
                {e.note}
              </span>
            </th>
            <td
              className={`fig py-3 pr-4 whitespace-nowrap ${
                cutting ? "text-iron" : "text-ink-2"
              }`}
            >
              {STANDING_LABEL[e.standing]}
            </td>
            <td className="fig py-3 text-ink-2">
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
    <section className="mt-12 first:mt-0">
      <h2 className="display text-2xl text-ink md:text-3xl">{heading}</h2>
      <p className="prose-farm mt-2 text-sm">{registerLine(register, date)}</p>

      <table className="mt-5 w-full border-collapse text-left">
        <caption className="sr-only">
          {heading} — what is growing, its standing, and its rhythm.
        </caption>
        <thead>
          <tr className="rule-head">
            <th scope="col" className="fig pb-2 pr-4 font-medium text-ink">
              Crop
            </th>
            <th scope="col" className="fig pb-2 pr-4 font-medium text-ink">
              Standing
            </th>
            <th scope="col" className="fig pb-2 font-medium text-ink">
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
