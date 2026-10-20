"use client";

import { Ban, Ellipsis, Flag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePost } from "@/actions/posts";
import { BlockDialog } from "@/components/block-dialog";
import { ReportDialog } from "@/components/post/report-dialog";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "@/components/ui/menu";

export function PostMenu({
  postId,
  authorId,
  authorUsername,
  isOwn,
  isSignedIn,
  redirectAfterDelete,
}: {
  postId: string;
  authorId: string;
  authorUsername: string;
  isOwn: boolean;
  isSignedIn: boolean;
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"report" | "block" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();
  const close = (open: boolean) => !open && setDialog(null);

  function requireSignIn(next: "report" | "block") {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setDialog(next);
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deletePost(postId);
      setDialog(null);
      if (!result.ok) {
        toast(result.error.message);
        return;
      }
      toast("Post deleted.");
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    });
  }

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label="Post options"
            className="-mr-2 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Ellipsis aria-hidden="true" className="size-5" />
          </button>
        </MenuTrigger>
        <MenuContent>
          {isOwn ? (
            <MenuItem tone="danger" onSelect={() => setDialog("delete")}>
              <Trash2 aria-hidden="true" className="size-4" /> Delete post
            </MenuItem>
          ) : (
            <>
              <MenuItem onSelect={() => requireSignIn("report")}>
                <Flag aria-hidden="true" className="size-4" /> Report post
              </MenuItem>
              <MenuItem tone="danger" onSelect={() => requireSignIn("block")}>
                <Ban aria-hidden="true" className="size-4" /> Block @{authorUsername}
              </MenuItem>
            </>
          )}
        </MenuContent>
      </MenuRoot>

      {isOwn ? (
        <Dialog open={dialog === "delete"} onOpenChange={close}>
          <DialogContent
            title="Delete this post?"
            description="It disappears from your profile and every feed, along with its photos. Replies from others stay up. This can't be undone."
          >
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="danger" onClick={confirmDelete} disabled={pending}>
                {pending ? "Deleting…" : "Delete post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <>
          <ReportDialog
            open={dialog === "report"}
            onOpenChange={close}
            targetType="post"
            targetId={postId}
            targetLabel={`this post by @${authorUsername}`}
          />
          <BlockDialog open={dialog === "block"} onOpenChange={close} profileId={authorId} username={authorUsername} />
        </>
      )}
    </>
  );
}
