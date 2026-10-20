import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { EmptyState, Feed } from "@/components/post/feed";
import { PostBody } from "@/components/post/post-body";
import { FollowButton, ProfileMenu, UnblockButton } from "@/components/profile-actions";
import { PageHeader } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { compactCount } from "@/lib/format";
import { getProfile, getViewer } from "@/lib/queries";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const page = await getProfile(username);
  if (!page) return { title: "Profile not found" };
  return { title: `${page.profile.displayName} (@${page.profile.username})`, description: page.profile.bio || undefined };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const [page, viewer] = await Promise.all([getProfile(username), getViewer()]);
  if (!page) notFound();
  const { profile, relationship } = page;
  const isOwn = viewer?.id === profile.id;
  const joined = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <PageHeader title={profile.displayName} />
      <section className="border-b border-border px-4 pb-5 pt-6 sm:px-5" aria-label="Profile">
        <div className="flex items-start justify-between gap-4">
          <Avatar path={profile.avatarPath} name={profile.displayName} size="lg" />
          <div className="flex items-center gap-2 pt-2">
            {isOwn ? (
              <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>Edit profile</Link>
            ) : viewer ? (
              <>
                <ProfileMenu profileId={profile.id} username={profile.username} isSignedIn blocked={relationship.blocked} />
                {relationship.blocked ? (
                  <UnblockButton profileId={profile.id} username={profile.username} />
                ) : relationship.blockedBy || profile.suspended ? null : (
                  <FollowButton profileId={profile.id} following={relationship.following} />
                )}
              </>
            ) : (
              <>
                <ProfileMenu profileId={profile.id} username={profile.username} isSignedIn={false} blocked={false} />
                <Link href={`/login?next=/u/${profile.username}`} className={buttonVariants({ size: "sm" })}>Follow</Link>
              </>
            )}
          </div>
        </div>
        <h2 className="mt-4 font-display text-[2.4rem] font-extrabold uppercase leading-[0.95] tracking-wide break-words">
          {profile.displayName}
        </h2>
        <p className="mt-1 text-muted">
          @{profile.username}
          {relationship.followedBy ? <span className="ml-2 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs">Follows you</span> : null}
        </p>
        {profile.bio ? <PostBody body={profile.bio} /> : null}
        <p className="mt-3 text-sm text-muted">Joined {joined}</p>
        <dl className="mt-3 flex gap-5 text-sm">
          <div className="flex gap-1.5"><dt className="sr-only">Posts</dt><dd><span className="font-semibold">{compactCount(profile.posts)}</span> <span className="text-muted">posts</span></dd></div>
          <div className="flex gap-1.5"><dt className="sr-only">Followers</dt><dd><span className="font-semibold">{compactCount(profile.followers)}</span> <span className="text-muted">followers</span></dd></div>
          <div className="flex gap-1.5"><dt className="sr-only">Following</dt><dd><span className="font-semibold">{compactCount(profile.following)}</span> <span className="text-muted">following</span></dd></div>
        </dl>
      </section>

      {profile.suspended ? (
        <EmptyState title="Account suspended">
          <p>This account broke the Community Guidelines and is suspended.</p>
        </EmptyState>
      ) : relationship.blocked ? (
        <EmptyState title={`You blocked @${profile.username}`}>
          <p>You won&apos;t see their posts and they can&apos;t interact with you. Unblock to see them again.</p>
        </EmptyState>
      ) : relationship.blockedBy ? (
        <EmptyState title="You can't see these posts">
          <p>@{profile.username} has limited who can see their posts.</p>
        </EmptyState>
      ) : (
        <Feed
          kind={{ type: "profile", profileId: profile.id }}
          empty={
            <EmptyState title={isOwn ? "Your first post goes here" : "No posts yet"}>
              <p>{isOwn ? "Share your grow, a session or a question. It shows up here and in your followers' feeds." : `@${profile.username} hasn't posted yet.`}</p>
              {isOwn ? <Link href="/home?compose=1" className={buttonVariants({ className: "mt-6" })}>Write a post</Link> : null}
            </EmptyState>
          }
        />
      )}
    </>
  );
}
