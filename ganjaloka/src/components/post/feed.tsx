import type { ReactNode } from "react";
import { FeedItemCard } from "@/components/post/post-card";
import { LoadMore } from "@/components/post/load-more";
import { type FeedKind, getFeed, getViewer } from "@/lib/queries";

export async function Feed({ kind, empty }: { kind: FeedKind; empty: ReactNode }) {
  const [page, viewer] = await Promise.all([getFeed(kind), getViewer()]);
  if (page.items.length === 0) return <>{empty}</>;
  return (
    <div>
      {page.items.map((item, i) => (
        <FeedItemCard key={item.key} item={item} viewer={viewer} preloadMedia={i === 0} />
      ))}
      {page.nextCursor ? (
        <LoadMore kind={kind} initialCursor={page.nextCursor} />
      ) : (
        <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
      )}
    </div>
  );
}

export function FeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 border-b border-border px-5 py-5">
          <div className="size-11 shrink-0 rounded-full bg-surface-2" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="h-3 w-1/3 rounded-full bg-surface-2" />
            <div className="h-3 w-5/6 rounded-full bg-surface-2" />
            <div className="h-3 w-2/3 rounded-full bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-6 py-16 text-center">
      <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide">{title}</h2>
      <div className="mx-auto mt-3 max-w-sm text-muted">{children}</div>
    </div>
  );
}
