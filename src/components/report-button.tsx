"use client";

import { useState, useTransition } from "react";
import { reportPost } from "@/lib/social-posts";

export function ReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<"idle" | "sent" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  if (done === "sent") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-frost-dim">
        Reported — thanks
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-frost-dim transition hover:text-frost"
      >
        Report
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        startTransition(async () => {
          const result = await reportPost(postId, reason.trim());
          setDone(result.ok ? "sent" : "error");
        });
      }}
    >
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong with this post?"
        maxLength={200}
        className="glass min-w-0 flex-1 rounded-full px-3 py-1.5 text-xs text-frost placeholder:text-frost-dim/60 focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending || !reason.trim()}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-magenta disabled:opacity-40"
      >
        Send
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-frost-dim"
      >
        Cancel
      </button>
      {done === "error" && (
        <span className="w-full font-mono text-[10px] text-magenta">
          Couldn&apos;t send — try again.
        </span>
      )}
    </form>
  );
}
