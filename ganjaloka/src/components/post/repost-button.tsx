"use client";

import { Repeat2 } from "lucide-react";
import { useState, useTransition } from "react";
import { setRepost } from "@/actions/posts";
import { toast } from "@/components/toaster";
import { compactCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RepostButton({
  postId,
  reposted: initial,
  count: initialCount,
}: {
  postId: string;
  reposted: boolean;
  count: number;
}) {
  const [state, setState] = useState({ reposted: initial, count: initialCount });
  const [pending, startTransition] = useTransition();

  function toggle() {
    const previous = state;
    const next = { reposted: !state.reposted, count: Math.max(0, state.count + (state.reposted ? -1 : 1)) };
    setState(next);
    startTransition(async () => {
      const result = await setRepost(postId, next.reposted);
      if (!result.ok) {
        setState(previous);
        toast(result.error.message);
      } else {
        toast(next.reposted ? "Reposted to your followers." : "Repost removed.");
      }
    });
  }

  const label = `${state.reposted ? "Undo repost" : "Repost"} · ${state.count} ${state.count === 1 ? "repost" : "reposts"}`;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.reposted}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm transition-colors hover:text-foreground",
        state.reposted ? "text-foreground" : "text-muted",
      )}
    >
      <Repeat2 aria-hidden="true" className="size-5" strokeWidth={state.reposted ? 2.6 : 2} />
      <span className="tabular-nums">{state.count > 0 ? compactCount(state.count) : ""}</span>
    </button>
  );
}
