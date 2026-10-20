"use client";

import { useState, useTransition } from "react";
import { setLike } from "@/actions/posts";
import { Trichome } from "@/components/trichome";
import { toast } from "@/components/toaster";
import { compactCount } from "@/lib/format";
import { ripenessFor } from "@/lib/ripeness";

export function LikeButton({
  postId,
  liked: initialLiked,
  count: initialCount,
}: {
  postId: string;
  liked: boolean;
  count: number;
}) {
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [pending, startTransition] = useTransition();

  function toggle() {
    const previous = state;
    const next = { liked: !state.liked, count: Math.max(0, state.count + (state.liked ? -1 : 1)) };
    setState(next);
    startTransition(async () => {
      const result = await setLike(postId, next.liked);
      if (!result.ok) {
        setState(previous);
        toast(result.error.message);
      }
    });
  }

  const label = `${state.liked ? "Unlike" : "Like"} · ${state.count} ${state.count === 1 ? "like" : "likes"}`;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.liked}
      aria-label={label}
      title={label}
      className="group -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm text-muted transition-colors hover:text-foreground"
    >
      <Trichome ripeness={ripenessFor(state.count)} liked={state.liked} className="transition-transform group-active:scale-90" />
      <span className="tabular-nums">{state.count > 0 ? compactCount(state.count) : ""}</span>
    </button>
  );
}
