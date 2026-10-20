import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/post/feed";
import { PageHeader } from "@/components/shell/app-shell";
import { publicMediaUrl } from "@/lib/env";
import { relativeTime } from "@/lib/format";
import { getModerationQueue, getViewer } from "@/lib/queries";
import { REPORT_REASONS } from "@/lib/validation";
import { ModActions } from "./mod-actions";

export const metadata: Metadata = { title: "Moderation" };

const reasonLabel = (value: string) => REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

export default async function ModerationPage() {
  const viewer = await getViewer();
  if (!viewer || (viewer.role !== "moderator" && viewer.role !== "admin")) notFound();
  const queue = await getModerationQueue();

  return (
    <>
      <PageHeader title="Moderation">
        <span className="text-sm text-muted">{queue.length} open</span>
      </PageHeader>
      {queue.length === 0 ? (
        <EmptyState title="Queue is clear">
          <p>No open reports. Nice work.</p>
        </EmptyState>
      ) : (
        <ol>
          {queue.map((r) => {
            const snapshot = r.snapshot as { body?: string; media?: Array<{ path: string; alt?: string }>; username?: string; bio?: string };
            return (
              <li key={r.id} className="border-b border-border px-4 py-5 sm:px-5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={r.reason === "minor_safety" ? "rounded-md bg-danger px-2 py-0.5 font-semibold text-accent-foreground" : "rounded-md bg-surface-2 px-2 py-0.5 font-semibold"}>
                    {reasonLabel(r.reason)}
                  </span>
                  <span className="text-muted">
                    {r.targetType} · reported by @{r.reporter} · {relativeTime(r.createdAt)}
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm">
                  <p className="text-muted">
                    Target:{" "}
                    {r.targetAuthor ? (
                      <Link href={`/u/${r.targetAuthor.username}`} className="text-accent hover:underline">@{r.targetAuthor.username}</Link>
                    ) : (
                      "deleted account"
                    )}
                    {r.postId ? (
                      <>
                        {" · "}
                        <Link href={`/p/${r.postId}`} className="text-accent hover:underline">open post</Link>
                      </>
                    ) : r.targetType === "post" ? " · post deleted by author (evidence below)" : null}
                  </p>
                  {snapshot.body ? <p className="mt-2 whitespace-pre-wrap">{snapshot.body}</p> : null}
                  {snapshot.bio ? <p className="mt-2 whitespace-pre-wrap">Bio: {snapshot.bio}</p> : null}
                  {snapshot.media && snapshot.media.length > 0 ? (
                    <div className="mt-3 flex gap-2">
                      {snapshot.media.map((m) => (
                        <Image key={m.path} src={publicMediaUrl("post-media", m.path)} alt={m.alt ?? ""} width={96} height={96} className="size-24 rounded-lg object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
                {r.details ? <p className="mt-3 text-sm"><span className="text-muted">Reporter says:</span> {r.details}</p> : null}
                {r.reason === "minor_safety" ? (
                  <p className="mt-3 text-sm text-danger">
                    Child safety: remove + suspend, then file a CyberTipline report with NCMEC. Don&apos;t download or share the content.
                  </p>
                ) : null}
                <div className="mt-4">
                  <ModActions reportId={r.id} canRemove={Boolean(r.postId)} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
