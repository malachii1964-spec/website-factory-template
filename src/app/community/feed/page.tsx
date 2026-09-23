import type { Metadata } from "next";
import Link from "next/link";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { PostCard } from "@/components/post-card";
import { getSessionUser } from "@/lib/session";
import {
  getFollowingFeed,
  getLatestFeed,
  type FeedPost,
} from "@/lib/social-posts";
import { SocialTablesMissingError } from "@/lib/social-errors";

export const metadata: Metadata = {
  title: "Community Feed",
  description: "Real grows, posted live, from growers around the world.",
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "following" ? "following" : "latest";
  const sessionUser = await getSessionUser();

  let posts: FeedPost[];
  try {
    posts =
      tab === "following" ? await getFollowingFeed() : await getLatestFeed();
  } catch (err) {
    if (err instanceof SocialTablesMissingError) return <CommunityNotReady />;
    throw err;
  }

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
              Community
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Grow feed
            </h1>
          </div>
          <Link
            href="/community/new"
            className="btn-iris inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Post an update
          </Link>
        </div>

        <div className="mt-6 flex gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
          <Link
            href="/community/feed?tab=latest"
            className={`rounded-full px-4 py-2 transition ${
              tab === "latest"
                ? "btn-iris"
                : "glass text-frost-dim hover:text-frost"
            }`}
          >
            Latest
          </Link>
          <Link
            href="/community/feed?tab=following"
            className={`rounded-full px-4 py-2 transition ${
              tab === "following"
                ? "btn-iris"
                : "glass text-frost-dim hover:text-frost"
            }`}
          >
            Following
          </Link>
        </div>

        {tab === "following" && !sessionUser ? (
          <EmptyState
            heading="Sign in to follow growers"
            body="Create a free account to follow other growers and build a feed of just their updates."
            ctaHref="/join"
            ctaLabel="Join free →"
          />
        ) : posts.length === 0 ? (
          <EmptyState
            heading={
              tab === "following" ? "Nobody to show yet" : "No posts yet"
            }
            body={
              tab === "following"
                ? "Follow a few growers from the Latest tab and their updates will show up here."
                : "Be the first to post a grow update — photos, video, or just a caption."
            }
            ctaHref={
              tab === "following"
                ? "/community/feed?tab=latest"
                : "/community/new"
            }
            ctaLabel={
              tab === "following" ? "Browse Latest →" : "Post an update →"
            }
          />
        ) : (
          <div className="mt-8 space-y-4">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                viewerUserId={sessionUser?.id ?? null}
              />
            ))}
          </div>
        )}
      </main>
      <OsFooter />
    </div>
  );
}

function EmptyState({
  heading,
  body,
  ctaHref,
  ctaLabel,
}: {
  heading: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="glass iris-border mt-8 rounded-3xl p-8 text-center">
      <h2 className="font-display text-2xl font-semibold">{heading}</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-frost-dim">
        {body}
      </p>
      <Link
        href={ctaHref}
        className="btn-iris mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function CommunityNotReady() {
  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="glass iris-border rounded-3xl p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            Almost ready
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
            The community feed is being switched on
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-frost-dim">
            This feature is finished but not live on the site yet. Check back
            shortly.
          </p>
          <Link
            href="/guides"
            className="btn-iris mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Read the grow guides meanwhile →
          </Link>
        </div>
      </main>
      <OsFooter />
    </div>
  );
}
