import type { Metadata } from "next";
import { Composer } from "@/components/composer";
import { EmptyState } from "@/components/post/feed";
import { LoadMore } from "@/components/post/load-more";
import { PostCard } from "@/components/post/post-card";
import { PageHeader } from "@/components/shell/app-shell";
import { getPost, getReplies, getViewer } from "@/lib/queries";
import { uuid } from "@/lib/validation";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!uuid.safeParse(id).success) return null;
  return getPost(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await load((await params).id);
  if (!post) return { title: "Post unavailable" };
  return {
    title: `${post.author.display_name}: “${post.body.slice(0, 60)}${post.body.length > 60 ? "…" : ""}”`,
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const [post, viewer] = await Promise.all([load(id), getViewer()]);

  if (!post) {
    return (
      <>
        <PageHeader title="Post" />
        <EmptyState title="This post isn't available">
          <p>It may have been deleted, removed by moderators, or posted by an account you can&apos;t see.</p>
        </EmptyState>
      </>
    );
  }

  const parent = post.replyingTo && post.replyingTo !== "unavailable" ? await getPost(post.replyingTo.postId) : null;
  const { replies, nextCursor } = await getReplies(post.id);

  return (
    <>
      <PageHeader title="Post" />
      {parent ? (
        <div className="opacity-90">
          <PostCard post={parent} viewer={viewer} />
        </div>
      ) : null}
      <PostCard post={post} viewer={viewer} emphasis preloadMedia />
      <div id="reply">
        {viewer && !viewer.suspended && !post.removed ? (
          <Composer viewer={viewer} replyToId={post.id} placeholder={`Reply to @${post.author.username}`} />
        ) : null}
      </div>
      <section aria-label="Replies">
        {replies.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No replies yet.{viewer ? " Start the conversation." : ""}</p>
        ) : (
          <>
            {replies.map((reply) => (
              <PostCard key={reply.id} post={reply} viewer={viewer} />
            ))}
            {nextCursor ? <LoadMore kind={{ type: "thread", postId: post.id }} initialCursor={nextCursor} label="Show more replies" /> : null}
          </>
        )}
      </section>
    </>
  );
}
