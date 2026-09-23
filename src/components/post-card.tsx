import Image from "next/image";
import Link from "next/link";
import { getStage } from "@/lib/stages";
import type { FeedPost } from "@/lib/social-posts";
import { ReportButton } from "@/components/report-button";

export function PostCard({
  post,
  viewerUserId,
}: {
  post: FeedPost;
  viewerUserId: string | null;
}) {
  const stage = post.stage ? getStage(post.stage) : undefined;
  const isOwn = viewerUserId === post.authorUserId;

  return (
    <article className="glass min-w-0 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/community/u/${post.authorHandle}`}
          className="flex min-w-0 items-center gap-2.5"
        >
          {post.authorImage ? (
            <Image
              src={post.authorImage}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm text-frost-dim">
              {post.authorName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold text-frost">
              {post.authorName}
            </span>
            <span className="block truncate font-mono text-[10px] text-frost-dim">
              @{post.authorHandle}
            </span>
          </span>
        </Link>
        <time
          dateTime={post.createdAt.toISOString()}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-frost-dim"
        >
          {post.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>

      {(stage || post.strainName) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stage && (
            <span className="iris-border rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gold">
              {stage.shortName}
            </span>
          )}
          {post.strainName &&
            (post.strainSlug ? (
              <Link
                href={`/strains/${post.strainSlug}`}
                className="iris-border rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-magenta transition hover:brightness-125"
              >
                {post.strainName}
              </Link>
            ) : (
              <span className="iris-border rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-magenta">
                {post.strainName}
              </span>
            ))}
        </div>
      )}

      {post.body && (
        <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-frost">
          {post.body}
        </p>
      )}

      {post.media.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {post.media.map((m) =>
            m.kind === "video" ? (
              <video
                key={m.id}
                src={m.url}
                controls
                className="max-h-96 w-full min-w-0 rounded-xl bg-black/40 object-contain"
              />
            ) : (
              // Full-URL user media — next/image would require allowlisting
              // every possible host, so a plain <img> keeps arbitrary hosts working.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.id}
                src={m.url}
                alt=""
                loading="lazy"
                className="max-h-96 w-full min-w-0 rounded-xl border border-white/10 object-cover"
              />
            ),
          )}
        </div>
      )}

      {!isOwn && (
        <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
          <ReportButton postId={post.id} />
        </div>
      )}
    </article>
  );
}
