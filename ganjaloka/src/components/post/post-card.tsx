import { MessageCircle, Repeat2 } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { LikeButton } from "@/components/post/like-button";
import { PhotoGrid } from "@/components/post/photo-grid";
import { PostBody } from "@/components/post/post-body";
import { PostMenu } from "@/components/post/post-menu";
import { RepostButton } from "@/components/post/repost-button";
import { Trichome } from "@/components/trichome";
import { compactCount, relativeTime } from "@/lib/format";
import type { FeedItem, PostView, Viewer } from "@/lib/queries";
import { ripenessFor } from "@/lib/ripeness";
import { cn } from "@/lib/utils";

function SignInAction({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Link
      href="/login"
      aria-label={`${label} — log in first`}
      className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm text-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function PostCard({
  post,
  viewer,
  repostedBy,
  emphasis = false,
  preloadMedia = false,
}: {
  post: PostView;
  viewer: Viewer | null;
  repostedBy?: { username: string; display_name: string } | null;
  emphasis?: boolean;
  preloadMedia?: boolean;
}) {
  const href = `/p/${post.id}`;
  const isOwn = viewer?.id === post.author.id;

  return (
    <article className={cn("border-b border-border px-4 py-4 sm:px-5", emphasis && "bg-surface/40")}>
      {repostedBy ? (
        <p className="mb-2 flex items-center gap-2 pl-[3.25rem] text-xs font-semibold text-muted">
          <Repeat2 aria-hidden="true" className="size-3.5" />
          <Link href={`/u/${repostedBy.username}`} className="hover:underline">
            {repostedBy.display_name}
          </Link>{" "}
          reposted
        </p>
      ) : null}

      <div className="flex gap-3">
        <Link href={`/u/${post.author.username}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <Avatar path={post.author.avatar_path} name={post.author.display_name} />
        </Link>

        <div className="min-w-0 flex-1">
          <header className="flex items-start gap-2">
            <div className="min-w-0 flex-1 truncate text-sm">
              <Link href={`/u/${post.author.username}`} className="font-semibold hover:underline">
                {post.author.display_name}
              </Link>{" "}
              <span className="text-muted">@{post.author.username}</span>
              <span className="text-muted" aria-hidden="true">
                {" · "}
              </span>
              <Link href={href} className="text-muted hover:underline">
                <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
              </Link>
            </div>
            <PostMenu
              postId={post.id}
              authorId={post.author.id}
              authorUsername={post.author.username}
              isOwn={isOwn}
              isSignedIn={Boolean(viewer)}
            />
          </header>

          {post.replyingTo ? (
            <p className="text-sm text-muted">
              {post.replyingTo === "unavailable" ? (
                "Replying to a post that's no longer available"
              ) : (
                <>
                  Replying to{" "}
                  <Link href={`/p/${post.replyingTo.postId}`} className="text-accent hover:underline">
                    @{post.replyingTo.username}
                  </Link>
                </>
              )}
            </p>
          ) : null}

          {post.removed ? (
            <p className="mt-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
              Moderators removed this post for breaking the Community Guidelines. Only you and moderators can see it.
            </p>
          ) : null}

          <PostBody body={post.body} />
          <PhotoGrid media={post.media} preload={preloadMedia} />

          <footer className="mt-2 flex items-center gap-6">
            {viewer ? (
              <Link
                href={`${href}#reply`}
                aria-label={`Reply · ${post.replyCount} ${post.replyCount === 1 ? "reply" : "replies"}`}
                className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm text-muted hover:text-foreground"
              >
                <MessageCircle aria-hidden="true" className="size-5" />
                <span className="tabular-nums">{post.replyCount > 0 ? compactCount(post.replyCount) : ""}</span>
              </Link>
            ) : (
              <SignInAction label="Reply">
                <MessageCircle aria-hidden="true" className="size-5" />
                <span className="tabular-nums">{post.replyCount > 0 ? compactCount(post.replyCount) : ""}</span>
              </SignInAction>
            )}
            {viewer && !isOwn ? (
              <RepostButton postId={post.id} reposted={post.viewerReposted} count={post.repostCount} />
            ) : (
              <span
                className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm text-muted"
                aria-label={`${post.repostCount} reposts`}
              >
                <Repeat2 aria-hidden="true" className="size-5 opacity-60" />
                <span className="tabular-nums">{post.repostCount > 0 ? compactCount(post.repostCount) : ""}</span>
              </span>
            )}
            {viewer ? (
              <LikeButton postId={post.id} liked={post.viewerLiked} count={post.likeCount} />
            ) : (
              <SignInAction label="Like">
                <LikeGlyph count={post.likeCount} />
              </SignInAction>
            )}
          </footer>
        </div>
      </div>
    </article>
  );
}

function LikeGlyph({ count }: { count: number }) {
  return (
    <>
      <Trichome ripeness={ripenessFor(count)} liked={false} />
      <span className="tabular-nums">{count > 0 ? compactCount(count) : ""}</span>
    </>
  );
}

export function FeedItemCard({ item, viewer, preloadMedia }: { item: FeedItem; viewer: Viewer | null; preloadMedia?: boolean }) {
  if (!item.post) {
    return (
      <p className="border-b border-border px-5 py-4 text-sm text-muted">
        {item.repostedBy ? `@${item.repostedBy.username} reposted a post that's no longer available.` : "This post is no longer available."}
      </p>
    );
  }
  return <PostCard post={item.post} viewer={viewer} repostedBy={item.repostedBy} preloadMedia={preloadMedia} />;
}
