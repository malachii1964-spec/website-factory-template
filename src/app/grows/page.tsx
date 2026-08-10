import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { getSessionUser } from "@/lib/session";
import { listGrows } from "@/lib/grow-journals";
import {
  buildTasks,
  dayOfGrow,
  getMethod,
  nextAction,
  progress,
} from "@/lib/grow-journal";
import { getGrow } from "@/lib/grow-journals";

export const metadata: Metadata = {
  title: "My grows",
  description: "Your grow journals — every top-dress on a date, with amounts.",
};

export default async function GrowsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/grows");

  const grows = await listGrows();
  const cards = await Promise.all(
    grows.map(async (g) => {
      const method = getMethod(g.methodSlug);
      const detail = await getGrow(g.id);
      if (!method || !detail) return null;
      const tasks = buildTasks(method, {
        potGallons: g.potGallons,
        plants: g.plants,
        startedOn: g.startedOn,
        doneEventIds: detail.doneEventIds,
      });
      return { grow: g, method, tasks, next: nextAction(tasks), p: progress(tasks) };
    }),
  );

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Member
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          My grows
        </h1>
        <p className="mt-3 text-frost-dim">
          Each journal follows a master grower&apos;s method, dated from the day
          you potted up.
        </p>

        {cards.filter(Boolean).length === 0 ? (
          <div className="glass iris-border mt-8 rounded-3xl p-8 text-center">
            <h2 className="font-display text-2xl font-semibold">
              No grows yet
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-frost-dim">
              Pick a method and it becomes a dated schedule — every top-dress
              with the exact amounts for your pots, nothing to work out
              yourself.
            </p>
            <Link
              href="/grow-like-the-greats/mr-canucks-grow#start"
              className="btn-iris mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              Start one the Mr. Canucks Grow way →
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {cards.map((c) =>
              c ? (
                <Link
                  key={c.grow.id}
                  href={`/grows/${c.grow.id}`}
                  className="glass group block min-w-0 rounded-2xl p-5 transition hover:brightness-125"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="font-display text-xl font-semibold">
                      {c.grow.name}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
                      Day {dayOfGrow(c.grow.startedOn)} · {c.grow.plants} ×{" "}
                      {c.grow.potGallons} gal
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-magenta"
                      style={{ width: `${c.p.pct}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-frost-dim">
                    {c.next ? (
                      <>
                        <span
                          className={
                            c.next.state === "due" ? "text-lime" : "text-frost"
                          }
                        >
                          {c.next.state === "due" ? "Due now: " : "Next: "}
                        </span>
                        {c.next.event.title}
                      </>
                    ) : (
                      <span className="text-lime">
                        Schedule complete — ride it out on plain water.
                      </span>
                    )}
                  </p>
                </Link>
              ) : null,
            )}
          </div>
        )}
      </main>
      <OsFooter />
    </div>
  );
}
