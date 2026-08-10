"use client";

/**
 * The top-dress calculator. The one client island on this page.
 *
 * Everything it knows lives in canucks-method.ts as pure, tested functions —
 * this file is inputs, formatting and a table. If you are changing the numbers,
 * change them there.
 */

import { useMemo, useState } from "react";
import {
  addDays,
  doseSchedule,
  formatDate,
  PH_RANGE,
  runTotals,
  tbspLabel,
  waterPerWatering,
} from "@/lib/canucks-method";

const POT_SIZES = [1, 3, 5, 7, 10, 15];

export function CanucksCalculator() {
  const [pot, setPot] = useState(5);
  // Kept as the raw string so the field can be empty mid-edit. Clearing it to
  // retype must not snap the value to 1 under the user's cursor.
  const [plantsInput, setPlantsInput] = useState("2");
  const [startDate, setStartDate] = useState("");

  const plants = useMemo(() => {
    const n = Number(plantsInput);
    return plantsInput.trim() === "" || !Number.isFinite(n)
      ? 1
      : Math.min(24, Math.max(1, Math.round(n)));
  }, [plantsInput]);

  const doses = useMemo(() => doseSchedule(pot, plants), [pot, plants]);
  const totals = useMemo(() => runTotals(pot, plants), [pot, plants]);
  const [waterLo, waterHi] = useMemo(() => waterPerWatering(pot), [pot]);

  // Parse as local noon so a timezone offset can never shift the calendar day.
  const start = useMemo(() => {
    if (!startDate) return null;
    const d = new Date(`${startDate}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [startDate]);

  return (
    <section
      id="calculator"
      className="glass iris-border scroll-mt-24 rounded-3xl p-5 sm:p-7"
    >
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
        Top-dress calculator
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-frost-dim">
        Your pot size and plant count, his schedule. Add the day you potted up
        and it becomes real dates you can put on a calendar.
      </p>

      {/* ------------------------------------------------------- inputs -- */}
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div>
          <label
            htmlFor="cnk-pot"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim"
          >
            Pot size
          </label>
          <select
            id="cnk-pot"
            value={pot}
            onChange={(e) => setPot(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-white/15 bg-void-2 px-3 py-2.5 text-sm text-frost outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            {POT_SIZES.map((g) => (
              <option key={g} value={g}>
                {g} gallon
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="cnk-plants"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim"
          >
            Plants
          </label>
          <input
            id="cnk-plants"
            type="number"
            min={1}
            max={24}
            value={plantsInput}
            onChange={(e) => setPlantsInput(e.target.value)}
            onBlur={() => setPlantsInput(String(plants))}
            className="mt-2 w-full rounded-xl border border-white/15 bg-void-2 px-3 py-2.5 text-sm text-frost outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          />
          {plantsInput.trim() !== "" && Number(plantsInput) > 24 ? (
            <p className="mt-1.5 font-mono text-[10px] text-gold">
              Capped at 24 plants — check your local limit.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="cnk-start"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim"
          >
            Potted up on{" "}
            <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="cnk-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-void-2 px-3 py-2.5 text-sm text-frost outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          />
        </div>
      </div>

      {/* ---------------------------------------------- schedule: mobile -- */}
      {/* The amounts are the whole point, so on a phone they get their own
          line rather than hiding behind a horizontal scroll. */}
      <ol className="mt-7 space-y-3 sm:hidden">
        {doses.map((d) => {
          const feeds = d.allPurposeTbsp + d.powerBloomTbsp > 0;
          return (
            <li
              key={d.event.id}
              className={`rounded-2xl border p-4 ${
                feeds
                  ? "border-white/12 bg-white/[0.03]"
                  : "border-white/[0.07] bg-transparent"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                {start ? (
                  <time
                    dateTime={addDays(start, d.dayOffset)
                      .toISOString()
                      .slice(0, 10)}
                  >
                    {formatDate(addDays(start, d.dayOffset))}
                  </time>
                ) : (
                  `Week ${d.event.week}`
                )}
              </p>
              <h3
                className={`mt-1 font-display text-base font-semibold ${
                  feeds ? "text-frost" : "text-frost-dim"
                }`}
              >
                {d.event.title}
              </h3>

              {feeds ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.allPurposeTbsp > 0 ? (
                    <Chip tone="gold" label="4-4-4" value={tbspLabel(d.allPurposeTbsp)} />
                  ) : null}
                  {d.powerBloomTbsp > 0 ? (
                    <Chip tone="magenta" label="2-8-4" value={tbspLabel(d.powerBloomTbsp)} />
                  ) : null}
                  {d.castingsTbsp > 0 ? (
                    <Chip tone="lime" label="Castings" value={tbspLabel(d.castingsTbsp)} />
                  ) : null}
                </div>
              ) : null}

              <p className="mt-2.5 text-xs leading-relaxed text-frost-dim">
                {d.event.detail}
              </p>
            </li>
          );
        })}
      </ol>

      {/* ----------------------------------------------- schedule: table -- */}
      <div className="mt-7 hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/15 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
              <th scope="col" className="py-2 pr-3 font-normal">
                {start ? "Date" : "Week"}
              </th>
              <th scope="col" className="py-2 pr-3 font-normal">
                Do this
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">
                <span className="text-gold">4-4-4</span>
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">
                <span className="text-magenta">2-8-4</span>
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                Castings
              </th>
            </tr>
          </thead>
          <tbody>
            {doses.map((d) => {
              const feeds = d.allPurposeTbsp + d.powerBloomTbsp > 0;
              return (
                <tr
                  key={d.event.id}
                  className={`border-b border-white/[0.07] align-top ${
                    feeds ? "" : "text-frost-dim"
                  }`}
                >
                  <td className="whitespace-nowrap py-3 pr-3 font-mono text-xs">
                    {start ? (
                      <time
                        dateTime={addDays(start, d.dayOffset)
                          .toISOString()
                          .slice(0, 10)}
                      >
                        {formatDate(addDays(start, d.dayOffset))}
                      </time>
                    ) : (
                      `Week ${d.event.week}`
                    )}
                  </td>
                  <td className="py-3 pr-3 text-sm">
                    <span className="font-semibold text-frost">
                      {d.event.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-frost-dim">
                      {d.event.detail}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-3 text-right font-mono text-xs text-gold">
                    {tbspLabel(d.allPurposeTbsp)}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-3 text-right font-mono text-xs text-magenta">
                    {tbspLabel(d.powerBloomTbsp)}
                  </td>
                  <td className="whitespace-nowrap py-3 text-right font-mono text-xs">
                    {tbspLabel(d.castingsTbsp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------ totals --- */}
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Stat
          label="All Purpose 4-4-4 for the run"
          value={tbspLabel(totals.allPurposeTbsp)}
          tone="text-gold"
        />
        <Stat
          label="Power Bloom 2-8-4 for the run"
          value={tbspLabel(totals.powerBloomTbsp)}
          tone="text-magenta"
        />
        <Stat
          label="Worm castings for the run"
          value={tbspLabel(totals.castingsTbsp)}
          tone="text-lime"
        />
      </div>

      <p className="mt-5 text-xs leading-relaxed text-frost-dim">
        Between top-dresses: plain water only, pH {PH_RANGE[0]}–{PH_RANGE[1]},
        about{" "}
        <strong className="font-semibold text-frost">
          {waterLo}–{waterHi} gal
        </strong>{" "}
        per {pot}-gallon pot per watering — a real soak with a little runoff,
        then let it dry back before the next one.
      </p>
    </section>
  );
}

const CHIP_TONE = {
  gold: "text-gold ring-gold/30",
  magenta: "text-magenta ring-magenta/30",
  lime: "text-lime ring-lime/30",
} as const;

function Chip({
  tone,
  label,
  value,
}: {
  tone: keyof typeof CHIP_TONE;
  label: string;
  value: string;
}) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs ring-1 ${CHIP_TONE[tone]}`}
    >
      <span className="text-[10px] uppercase tracking-[0.1em] opacity-70">
        {label}
      </span>
      <strong className="font-semibold">{value}</strong>
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl font-semibold ${tone}`}>
        {value}
      </p>
    </div>
  );
}
