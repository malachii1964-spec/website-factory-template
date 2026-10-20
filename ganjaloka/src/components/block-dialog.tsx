"use client";

import { useTransition } from "react";
import { setBlock } from "@/actions/social";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";

export function BlockDialog({
  open,
  onOpenChange,
  profileId,
  username,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  username: string;
}) {
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await setBlock(profileId, true);
      onOpenChange(false);
      toast(result.ok ? `@${username} is blocked. Undo it from their profile or Settings.` : result.error.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Block @${username}?`}
        description="You won't see each other's posts, you'll both stop following each other, and they can't reply to or like your posts. They won't be notified."
      >
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="danger" onClick={confirm} disabled={pending}>
            {pending ? "Blocking…" : `Block @${username}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
