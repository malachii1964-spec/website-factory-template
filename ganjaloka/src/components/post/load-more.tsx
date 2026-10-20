"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { type LoadableFeed, loadFeedPage } from "@/actions/feed";
import { Button } from "@/components/ui/button";

export function LoadMore({ kind, initialCursor, label = "Show older posts" }: { kind: LoadableFeed; initialCursor: string; label?: string }) {
  const [pages, setPages] = useState<ReactNode[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!cursor || pending) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const page = await loadFeedPage(kind, cursor);
        setPages((all) => [...all, page.node]);
        setCursor(page.nextCursor);
      } catch {
        setFailed(true);
      }
    });
  }, [cursor, kind, pending]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || failed) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && load(), {
      rootMargin: "600px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, failed, load]);

  return (
    <>
      {pages.map((node, i) => (
        <div key={i}>{node}</div>
      ))}
      <div ref={sentinel} className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-muted">
        {cursor ? (
          <>
            {failed ? <p role="alert">Couldn&apos;t load more posts. Check your connection.</p> : null}
            <Button variant="outline" size="sm" onClick={load} disabled={pending}>
              {pending ? "Loading…" : failed ? "Try again" : label}
            </Button>
          </>
        ) : (
          <p>You&apos;re all caught up.</p>
        )}
      </div>
    </>
  );
}
