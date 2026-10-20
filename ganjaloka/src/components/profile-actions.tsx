"use client";

import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setBlock, setFollow } from "@/actions/social";
import { BlockDialog } from "@/components/block-dialog";
import { ReportDialog } from "@/components/post/report-dialog";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "@/components/ui/menu";

export function FollowButton({ profileId, following: initial }: { profileId: string; following: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [hovering, setHovering] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await setFollow(profileId, next);
      if (!result.ok) {
        setFollowing(!next);
        toast(result.error.message);
      }
    });
  }

  return (
    <Button
      variant={following ? "outline" : "primary"}
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="min-w-28"
    >
      {following ? (hovering ? "Unfollow" : "Following") : "Follow"}
    </Button>
  );
}

export function UnblockButton({ profileId, username }: { profileId: string; username: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setBlock(profileId, false);
          toast(result.ok ? `@${username} is unblocked.` : result.error.message);
        })
      }
    >
      {pending ? "Unblocking…" : "Unblock"}
    </Button>
  );
}

export function ProfileMenu({
  profileId,
  username,
  isSignedIn,
  blocked,
}: {
  profileId: string;
  username: string;
  isSignedIn: boolean;
  blocked: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"report" | "block" | null>(null);

  function open(next: "report" | "block") {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(`/u/${username}`)}`);
      return;
    }
    setDialog(next);
  }

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <button type="button" aria-label={`More options for @${username}`} className="grid size-9 place-items-center rounded-full border border-border-strong text-muted hover:text-foreground">
            <Ellipsis className="size-5" aria-hidden="true" />
          </button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem onSelect={() => open("report")}>Report @{username}</MenuItem>
          {blocked ? null : (
            <MenuItem tone="danger" onSelect={() => open("block")}>Block @{username}</MenuItem>
          )}
        </MenuContent>
      </MenuRoot>
      <ReportDialog
        open={dialog === "report"}
        onOpenChange={(o) => !o && setDialog(null)}
        targetType="profile"
        targetId={profileId}
        targetLabel={`@${username}`}
      />
      <BlockDialog open={dialog === "block"} onOpenChange={(o) => !o && setDialog(null)} profileId={profileId} username={username} />
    </>
  );
}
