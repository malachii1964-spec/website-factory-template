import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { getSessionUser } from "@/lib/session";
import { deleteGrow, getGrow, toggleGrowEvent } from "@/lib/grow-journals";
import {
  buildTasks,
  dayOfGrow,
  getMethod,
  nextAction,
  progress,
} from "@/lib/grow-journal";
import { formatDate, PH_RANGE, tbspLabel, waterPerWatering } from "@/lib/canucks-method";

export const metadata: Metadata = {
  title: "Grow journal",
  robots: { index: false, follow: false },
};

export default async function GrowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/grows/${encodeURIComponent(id)}`);

  const detail = await getGrow(id);
  if (!detail) notFound();

  const method = getMethod(detail.methodSlug);
  if (!method) notFound();

  const tasks = buildTasks(method, {
    potGallons: detail.potGallons,
    plants: detail.plants,
    startedOn: detail.startedOn,
    doneEventIds: detail.doneEventIds,
  });
  const next = nextAction(tasks);
  const p = progress(tasks);
  const [waterLo, waterHi] = waterPerWatering(detail.potGallons);

  async function toggle(formData: FormData) {
    "use server";
    await toggleGrowEvent(id, String(formData.get("eventId") ?? ""));
  }

  async function remove() {
    "use server";
    await deleteGrow(id);
    redirect("/grows");
  }

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-frost-dim">
          <Link href="/grows" className="hover:text-frost">
            My grows
          </Link>{" "}
          / <span className="text-gold">Day {dayOfGrow(detail.startedOn)}</span>
        </nav>

        <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          {detail.name}
        </h1>
        <p className="mt-2 text-sm text-frost-dim">
          {detail.plants} plant{detail.plants === 1 ? "" : "s"} ·{" "}
          {detail.potGallons} gallon pots · started{" "}
          <time dateTime={detail.startedOn.toISOString().slice(0, 10)}>
            {formatDate(detail.startedOn)}
          </time>{" "}
          ·{" "}
          <Link
            href={`/grow-like-the-greats/${method.growerSlug}`}
            className="text-cyan underline underline-offset-2"
          >
            {method.name} method
          </Link>
        </p>

        {/* --------------------------------------------------- next up --- */}
        <div className="glass iris-border mt-7 rounded-3xl p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
            {next?.state === "due" ? "Do this now" : "Next up"}
          </h2>
          {next ? (
            <>
              <p className="mt-3 font-display text-2xl font-semibold">
                {next.event.title}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-frost-dim">
                <time dateTime={next.date.toISOString().slice(0, 10)}>
                  {formatDate(next.date)}
                </time>
              </p>
              {next.allPurposeTbsp + next.powerBloomTbsp > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {next.allPurposeTbsp > 0 ? (
                    <Amount tone="gold" label="4-4-4" v={tbspLabel(next.allPurposeTbsp)} />
                  ) : null}
                  {next.powerBloomTbsp > 0 ? (
                    <Amount tone="magenta" label="2-8-4" v={tbspLabel(next.powerBloomTbsp)} />
                  ) : null}
                  {next.castingsTbsp > 0 ? (
                    <Amount tone="lime" label="Castings" v={tbspLabel(next.castingsTbsp)} />
                  ) : null}
                </div>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-frost-dim">
                {next.event.detail}
              </p>
            </>
          ) : (
            <p className="mt-3 leading-relaxed text-frost-dim">
              Every scheduled task is ticked. From here it is plain water at pH{" "}
              {PH_RANGE[0]}–{PH_RANGE[1]} until the trichomes tell you to chop.
            </p>
          )}
        </div>

        {/* -------------------------------------------------- progress --- */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
            <span>Schedule progress</span>
            <span>
              {p.done} of {p.total}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-magenta"
              style={{ width: `${p.pct}%` }}
            />
          </div>
        </div>

        {/* ------------------------------------------------------ tasks --- */}
        <ol className="mt-8 space-y-3">
          {tasks.map((t) => (
            <li
              key={t.event.id}
              className={`rounded-2xl border p-5 transition ${
                t.done
                  ? "border-white/[0.07] bg-transparent"
                  : t.state === "due"
                    ? "border-lime/30 bg-lime/[0.04]"
                    : "border-white/12 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                    <time dateTime={t.date.toISOString().slice(0, 10)}>
                      {formatDate(t.date)}
                    </time>
                    {t.state === "due" ? (
                      <span className="ml-2 text-lime">· due</span>
                    ) : null}
                  </p>
                  <h3
                    className={`mt-1 font-display text-lg font-semibold ${
                      t.done ? "text-frost-dim line-through" : ""
                    }`}
                  >
                    {t.event.title}
                  </h3>
                </div>

                <form action={toggle} className="shrink-0">
                  <input type="hidden" name="eventId" value={t.event.id} />
                  <button
                    type="submit"
                    aria-pressed={t.done}
                    className={`rounded-full border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition focus-visible:ring-2 focus-visible:ring-cyan ${
                      t.done
                        ? "border-white/15 text-frost-dim hover:text-frost"
                        : "border-lime/40 text-lime hover:brightness-125"
                    }`}
                  >
                    {t.done ? "Undo" : "Mark done"}
                  </button>
                </form>
              </div>

              {t.allPurposeTbsp + t.powerBloomTbsp > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.allPurposeTbsp > 0 ? (
                    <Amount tone="gold" label="4-4-4" v={tbspLabel(t.allPurposeTbsp)} />
                  ) : null}
                  {t.powerBloomTbsp > 0 ? (
                    <Amount tone="magenta" label="2-8-4" v={tbspLabel(t.powerBloomTbsp)} />
                  ) : null}
                  {t.castingsTbsp > 0 ? (
                    <Amount tone="lime" label="Castings" v={tbspLabel(t.castingsTbsp)} />
                  ) : null}
                </div>
              ) : null}

              <p className="mt-2.5 text-xs leading-relaxed text-frost-dim">
                {t.event.detail}
              </p>
            </li>
          ))}
        </ol>

        <p className="glass mt-8 rounded-2xl p-5 text-sm leading-relaxed text-frost-dim">
          On every other day: plain water at pH {PH_RANGE[0]}–{PH_RANGE[1]},
          about{" "}
          <strong className="font-semibold text-frost">
            {waterLo}–{waterHi} gal
          </strong>{" "}
          per pot, then let it dry back before the next one. The schedule is a
          rhythm, not an order — read the plant first.
        </p>

        <form action={remove} className="mt-8">
          <button
            type="submit"
            className="rounded-full border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim transition hover:border-magenta/40 hover:text-frost focus-visible:ring-2 focus-visible:ring-cyan"
          >
            Delete this journal
          </button>
        </form>
      </main>
      <OsFooter />
    </div>
  );
}

const TONE = {
  gold: "text-gold ring-gold/30",
  magenta: "text-magenta ring-magenta/30",
  lime: "text-lime ring-lime/30",
} as const;

function Amount({
  tone,
  label,
  v,
}: {
  tone: keyof typeof TONE;
  label: string;
  v: string;
}) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs ring-1 ${TONE[tone]}`}
    >
      <span className="text-[10px] uppercase tracking-[0.1em] opacity-70">
        {label}
      </span>
      <strong className="font-semibold">{v}</strong>
    </span>
  );
}
