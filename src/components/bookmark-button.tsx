"use client";

/**
 * Save-to-almanac control.
 *
 * It resolves its own session and saved state on mount rather than receiving
 * them as props. That matters: as long as the page had to look up the session
 * and the bookmark list to render this one button, the whole guide route was
 * server-rendered per request and could never be cached. Moving the lookup here
 * lets ungated guides prerender and sit on the CDN.
 *
 * Nothing is rendered until the state is known, so a signed-out visitor never
 * sees a control that would do nothing, and there is no flash of the wrong
 * label for a member.
 */

import { useEffect, useState, useTransition } from "react";
import { listBookmarks, toggleBookmark } from "@/lib/bookmarks";

type State =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "member"; saved: boolean };

export function BookmarkButton({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/get-session", {
          credentials: "include",
        });
        const session = res.ok ? await res.json() : null;
        if (!live) return;
        if (!session?.user) {
          setState({ status: "anonymous" });
          return;
        }
        // listBookmarks() re-checks the session server-side and returns [] for
        // anyone signed out, so this cannot leak another member's list.
        const saved = await listBookmarks();
        if (!live) return;
        setState({ status: "member", saved: saved.includes(slug) });
      } catch {
        if (live) setState({ status: "anonymous" });
      }
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  if (state.status !== "member") return null;

  const { saved } = state;

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await toggleBookmark(slug);
          setState({ status: "member", saved: !saved });
        })
      }
      disabled={pending}
      aria-pressed={saved}
      className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-cyan ${
        saved
          ? "border-gold/60 bg-gold/10 text-gold"
          : "glass text-frost-dim hover:border-gold/60 hover:text-gold"
      }`}
    >
      {pending ? "Saving…" : saved ? "★ Saved" : "☆ Save to my almanac"}
    </button>
  );
}
