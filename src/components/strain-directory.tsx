"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DirectoryEntry, StrainCat } from "@/lib/strain-directory";

const TYPES: (StrainCat | "All")[] = ["All", "Indica", "Sativa", "Hybrid"];
const TYPE_COLOR: Record<string, string> = {
  Indica: "var(--violet)",
  Sativa: "var(--lime)",
  Hybrid: "var(--cyan)",
};

export function StrainDirectory({ entries }: { entries: DirectoryEntry[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [onlyProfiled, setOnlyProfiled] = useState(false);

  const query = q.trim().toLowerCase();
  const results = useMemo(
    () =>
      entries.filter((e) => {
        if (type !== "All" && e.type !== type) return false;
        if (onlyProfiled && !e.slug) return false;
        if (
          query &&
          !e.name.toLowerCase().includes(query) &&
          !(e.lineage ?? "").toLowerCase().includes(query)
        )
          return false;
        return true;
      }),
    [entries, query, type, onlyProfiled],
  );

  const profiledCount = entries.filter((e) => e.slug).length;

  return (
    <div>
      <div className="glass sticky top-20 z-10 space-y-3 rounded-2xl p-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${entries.length} strains by name or lineage…`}
          className="w-full rounded-full border border-white/10 bg-void-2 px-5 py-3 text-sm text-frost placeholder:text-frost-dim/60 focus:border-cyan/60 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                type === t
                  ? "bg-gradient-to-r from-cyan/30 to-violet/30 text-frost"
                  : "border border-white/10 text-frost-dim hover:text-frost"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setOnlyProfiled((v) => !v)}
            className={`ml-auto rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
              onlyProfiled
                ? "bg-gradient-to-r from-gold/30 to-magenta/30 text-frost"
                : "border border-white/10 text-frost-dim hover:text-frost"
            }`}
          >
            ★ Full profiles only
          </button>
        </div>
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
        {results.length} of {entries.length} strains · {profiledCount} with full grow
        profiles
      </p>

      {results.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center">
          <p className="font-display text-xl font-semibold">No matches.</p>
          <button
            onClick={() => {
              setQ("");
              setType("All");
              setOnlyProfiled(false);
            }}
            className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan hover:underline"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((e) => {
            const inner = (
              <>
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <h3 className="min-w-0 truncate font-display text-base font-semibold">
                    {e.name}
                  </h3>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]"
                    style={{
                      color: TYPE_COLOR[e.type],
                      border: `1px solid ${TYPE_COLOR[e.type]}`,
                    }}
                  >
                    {e.type}
                  </span>
                </div>
                {e.lineage ? (
                  <p className="mt-1 truncate text-[12px] text-frost-dim">{e.lineage}</p>
                ) : (
                  <p className="mt-1 text-[12px] text-frost-dim/50">—</p>
                )}
                {e.slug ? (
                  <span className="mt-2 inline-block font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-gold">
                    ★ Full grow profile →
                  </span>
                ) : null}
              </>
            );
            return e.slug ? (
              <Link
                key={e.name}
                href={`/strains/${e.slug}`}
                className="glass iris-border rounded-2xl p-4 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                {inner}
              </Link>
            ) : (
              <div key={e.name} className="glass rounded-2xl p-4">
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
