"use client";

/**
 * "Start a grow the <method> way" — turns the method into a saved journal.
 *
 * Session is resolved client-side with a bare fetch of get-session, matching
 * OsHeader, so the page it sits on stays statically rendered. That check only
 * decides which UI to show: startGrow() re-checks the session on the server,
 * so a forged submission from a signed-out client creates nothing.
 */

import { useEffect, useState } from "react";
import { POT_SIZES } from "@/lib/grow-journal";
import { startGrowFromForm } from "@/lib/grow-journals";

type Auth = "loading" | "in" | "out";

export function StartGrowForm({
  methodSlug,
  methodName,
  returnTo,
}: {
  methodSlug: string;
  methodName: string;
  returnTo: string;
}) {
  const [auth, setAuth] = useState<Auth>("loading");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setAuth(d?.user ? "in" : "out"))
      .catch(() => live && setAuth("out"));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="glass iris-border rounded-3xl p-6">
      <h2 className="font-display text-2xl font-semibold">
        Run this grow with me
      </h2>
      <p className="mt-3 leading-relaxed text-frost-dim">
        Start a free journal and this schedule becomes dated tasks you tick
        off — every top-dress on your calendar with the exact amounts for your
        pots. Nothing to work out later.
      </p>

      {auth === "loading" ? (
        <div
          className="mt-5 h-12 w-56 animate-pulse rounded-full bg-white/[0.06]"
          aria-hidden="true"
        />
      ) : auth === "out" ? (
        <>
          <a
            href={`/join?next=${encodeURIComponent(returnTo)}`}
            className="btn-iris mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Join free to start a journal
          </a>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
            Already a member?{" "}
            <a
              href={`/login?next=${encodeURIComponent(returnTo)}`}
              className="text-cyan underline underline-offset-2"
            >
              Sign in
            </a>
          </p>
        </>
      ) : (
        <form action={startGrowFromForm} onSubmit={() => setPending(true)}>
          <input type="hidden" name="methodSlug" value={methodSlug} />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
                Pot size
              </span>
              <select
                name="potGallons"
                defaultValue={5}
                className="mt-2 w-full rounded-xl border border-white/15 bg-void-2 px-3 py-2.5 text-sm text-frost outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                {POT_SIZES.map((g) => (
                  <option key={g} value={g}>
                    {g} gallon
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
                Plants
              </span>
              <input
                name="plants"
                type="number"
                min={1}
                max={24}
                defaultValue={2}
                className="mt-2 w-full rounded-xl border border-white/15 bg-void-2 px-3 py-2.5 text-sm text-frost outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-frost-dim">
                Potted up on
              </span>
              <input
                name="startedOn"
                type="date"
                className="mt-2 w-full rounded-xl border border-white/15 bg-void-2 px-3 py-2.5 text-sm text-frost outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-iris mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Starting…" : `Start a grow the ${methodName} way →`}
          </button>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
            Leave the date blank to start today
          </p>
        </form>
      )}
    </div>
  );
}
