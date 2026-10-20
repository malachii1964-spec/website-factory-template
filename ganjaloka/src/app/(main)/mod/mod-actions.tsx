"use client";

import { useTransition } from "react";
import { moderate } from "@/actions/reports";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";

type Action = "dismiss" | "remove_post" | "suspend_member" | "remove_and_suspend";

const LABELS: Record<Action, string> = {
  dismiss: "Dismiss",
  remove_post: "Remove post",
  suspend_member: "Suspend member",
  remove_and_suspend: "Remove + suspend",
};

export function ModActions({ reportId, canRemove }: { reportId: string; canRemove: boolean }) {
  const [pending, startTransition] = useTransition();
  const actions: Action[] = canRemove
    ? ["dismiss", "remove_post", "suspend_member", "remove_and_suspend"]
    : ["dismiss", "suspend_member"];

  function run(action: Action) {
    startTransition(async () => {
      const result = await moderate({ reportId, action });
      toast(result.ok ? `Done: ${LABELS[action].toLowerCase()}.` : result.error.message);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button key={a} size="sm" variant={a === "dismiss" ? "outline" : a === "remove_and_suspend" ? "danger" : "primary"} disabled={pending} onClick={() => run(a)}>
          {LABELS[a]}
        </Button>
      ))}
    </div>
  );
}
