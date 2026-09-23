"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/lib/social-profiles";

export function FollowButton({
  targetUserId,
  initiallyFollowing,
}: {
  targetUserId: string;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setFollowing((f) => !f); // optimistic; server action reconciles on revalidate
        startTransition(async () => {
          await toggleFollow(targetUserId);
        });
      }}
      className={
        following
          ? "glass rounded-full px-5 py-2 text-sm font-semibold text-frost-dim transition hover:text-frost disabled:opacity-60"
          : "btn-iris rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
