"use client";

/**
 * Client-side filtering for the guide library.
 *
 * Every guide card for the whole library is rendered on the server and handed
 * here as children, keyed by slug; this component only decides which ones are
 * visible. That keeps /guides fully static — the page is the same HTML for
 * everyone, so it is cached at the edge instead of re-rendered 153 guides deep
 * on every request — while search and stage filtering stay instant with no
 * round trip.
 *
 * Deep links (/guides?stage=flowering) still work: the initial filter is read
 * from the URL on mount, and changing a filter rewrites the URL so links stay
 * shareable and the back button behaves.
 */

import { useMemo, useSyncExternalStore } from "react";
import type { GuideMeta } from "@/lib/guides";
import { STAGES, type StageId } from "@/lib/stages";

/**
 * The URL query string is the single source of truth for the filter, read
 * through useSyncExternalStore so it is hydration-safe by construction: the
 * server snapshot is always empty (the prerendered HTML is the unfiltered
 * library), and the real query string takes over once the client takes control.
 * No filter state is duplicated in the component, so there is nothing to sync.
 */
const searchStore = {
  listeners: new Set<() => void>(),
  subscribe(fn: () => void) {
    searchStore.listeners.add(fn);
    window.addEventListener("popstate", fn);
    return () => {
      searchStore.listeners.delete(fn);
      window.removeEventListener("popstate", fn);
    };
  },
  emit() {
    for (const fn of searchStore.listeners) fn();
  },
  get() {
    return window.location.search;
  },
  getServer() {
    return "";
  },
};

type Props = {
  guides: GuideMeta[];
  /** Server-rendered card per slug. */
  cards: Record<string, React.ReactNode>;
  /** Server-rendered stage heading block per stage id. */
  stageHeadings: Record<string, React.ReactNode>;
};

export function GuideBrowser({ guides, cards, stageHeadings }: Props) {
  const search = useSyncExternalStore(
    searchStore.subscribe,
    searchStore.get,
    searchStore.getServer,
  );

  const { stage, query } = useMemo(() => {
    const p = new URLSearchParams(search);
    const s = p.get("stage");
    return {
      stage: s && STAGES.some((x) => x.id === s) ? (s as StageId) : null,
      query: p.get("q") ?? "",
    };
  }, [search]);

  function apply(nextStage: StageId | null, nextQuery: string) {
    const p = new URLSearchParams();
    if (nextStage) p.set("stage", nextStage);
    if (nextQuery.trim()) p.set("q", nextQuery.trim());
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/guides?${qs}` : "/guides");
    searchStore.emit();
  }

  const stageCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of guides) m.set(g.stage, (m.get(g.stage) ?? 0) + 1);
    return m;
  }, [guides]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter(
      (g) =>
        (!stage || g.stage === stage) &&
        (!q ||
          g.title.toLowerCase().includes(q) ||
          g.summary.toLowerCase().includes(q)),
    );
  }, [guides, stage, query]);

  const grouped = !stage && !query.trim();

  return (
    <>
      <div className="mt-8 flex max-w-md gap-2">
        <label htmlFor="guide-search" className="sr-only">
          Search guides
        </label>
        <input
          id="guide-search"
          type="search"
          value={query}
          onChange={(e) => apply(stage, e.target.value)}
          placeholder="Search: trichomes, mites, pH…"
          className="glass w-full rounded-full px-4 py-2.5 text-sm text-frost outline-none placeholder:text-frost-dim/60 focus-visible:ring-2 focus-visible:ring-cyan"
        />
        {query ? (
          <button
            type="button"
            onClick={() => apply(stage, "")}
            className="glass-hi rounded-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-frost-dim transition hover:text-frost focus-visible:ring-2 focus-visible:ring-cyan"
          >
            Clear
          </button>
        ) : null}
      </div>

      <nav aria-label="Filter by stage" className="mt-6 flex flex-wrap gap-2">
        <FilterPill
          active={!stage}
          onClick={() => apply(null, query)}
          label="All"
          count={guides.length}
        />
        {STAGES.map((s) => (
          <FilterPill
            key={s.id}
            active={stage === s.id}
            onClick={() => apply(s.id, query)}
            label={s.shortName}
            count={stageCounts.get(s.id) ?? 0}
          />
        ))}
      </nav>

      <p aria-live="polite" className="sr-only">
        {visible.length} guides shown
      </p>

      {visible.length === 0 ? (
        <div className="glass iris-border mt-12 rounded-2xl p-10 text-center">
          <p className="font-display text-xl font-semibold">
            Nothing matches that search.
          </p>
          <p className="mt-2 text-sm text-frost-dim">
            Try a broader term — or{" "}
            <button
              type="button"
              onClick={() => apply(null, "")}
              className="text-cyan underline underline-offset-2"
            >
              browse everything
            </button>
            .
          </p>
        </div>
      ) : grouped ? (
        <div className="mt-8 space-y-12">
          {STAGES.map((s) => {
            const inStage = visible.filter((g) => g.stage === s.id);
            if (inStage.length === 0) return null;
            return (
              <section key={s.id}>
                {stageHeadings[s.id]}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inStage.map((g) => (
                    <div key={g.slug}>{cards[g.slug]}</div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((g) => (
            <div key={g.slug}>{cards[g.slug]}</div>
          ))}
        </div>
      )}
    </>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition focus-visible:ring-2 focus-visible:ring-cyan ${
        active
          ? "border-cyan bg-cyan/15 text-cyan"
          : "border-white/10 text-frost-dim hover:border-white/25 hover:text-frost"
      }`}
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}
