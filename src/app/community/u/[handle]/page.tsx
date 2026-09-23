import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { PostCard } from "@/components/post-card";
import { FollowButton } from "@/components/follow-button";
import { getSessionUser } from "@/lib/session";
import { getProfileByHandle, isFollowing } from "@/lib/social-profiles";
import { getPassportSourcePosts, getUserFeed } from "@/lib/social-posts";
import { buildStrainPassport } from "@/lib/social-logic";
import { SocialTablesMissingError } from "@/lib/social-errors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle}`,
    description: `${handle}'s grows on Lake Erie Cannabis Community.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  let profile;
  try {
    profile = await getProfileByHandle(handle);
  } catch (err) {
    if (err instanceof SocialTablesMissingError) notFound();
    throw err;
  }
  if (!profile) notFound();

  const [sessionUser, posts, passportSource, following] = await Promise.all([
    getSessionUser(),
    getUserFeed(profile.userId),
    getPassportSourcePosts(profile.userId),
    isFollowing(profile.userId),
  ]);
  const passport = buildStrainPassport(passportSource);
  const isOwn = sessionUser?.id === profile.userId;

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="glass iris-border flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div className="flex min-w-0 items-center gap-4">
            {profile.image ? (
              <Image
                src={profile.image}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-2xl text-frost-dim">
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold">
                {profile.name}
              </h1>
              <p className="truncate font-mono text-xs text-frost-dim">
                @{profile.handle}
              </p>
              {profile.location && (
                <p className="mt-1 truncate text-sm text-frost-dim">
                  {profile.location}
                </p>
              )}
            </div>
          </div>
          {isOwn ? (
            <Link
              href="/community/settings"
              className="glass rounded-full px-5 py-2 text-sm font-semibold text-frost-dim transition hover:text-frost"
            >
              Edit profile
            </Link>
          ) : (
            <FollowButton
              targetUserId={profile.userId}
              initiallyFollowing={following}
            />
          )}
        </div>

        {profile.bio && (
          <p className="mt-4 leading-relaxed text-frost">{profile.bio}</p>
        )}

        <div className="mt-4 flex gap-6 font-mono text-xs text-frost-dim">
          <span>
            <span className="text-frost">{profile.followerCount}</span>{" "}
            followers
          </span>
          <span>
            <span className="text-frost">{profile.followingCount}</span>{" "}
            following
          </span>
          <span>
            <span className="text-frost">{posts.length}</span> posts
          </span>
        </div>

        {passport.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold">
              Strain passport
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {passport.map((entry) => (
                <div key={entry.key} className="glass rounded-2xl p-3">
                  {entry.coverMediaUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.coverMediaUrl}
                      alt=""
                      className="mb-2 h-20 w-full rounded-lg object-cover"
                    />
                  )}
                  {entry.strainSlug ? (
                    <Link
                      href={`/strains/${entry.strainSlug}`}
                      className="block truncate font-display text-sm font-semibold text-frost hover:text-magenta"
                    >
                      {entry.strainName}
                    </Link>
                  ) : (
                    <p className="truncate font-display text-sm font-semibold text-frost">
                      {entry.strainName}
                    </p>
                  )}
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-frost-dim">
                    {entry.postCount} {entry.postCount === 1 ? "post" : "posts"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Posts</h2>
          {posts.length === 0 ? (
            <p className="mt-3 text-frost-dim">No posts yet.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  viewerUserId={sessionUser?.id ?? null}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <OsFooter />
    </div>
  );
}
