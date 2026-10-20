"use client";

import { useId, useState, useTransition } from "react";
import { fileReport } from "@/actions/reports";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, FormError, Textarea, describedBy } from "@/components/ui/field";
import { LIMITS, REPORT_REASONS, type ReportReason } from "@/lib/validation";

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "profile";
  targetId: string;
  targetLabel: string;
}) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const detailsId = useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason) {
      setError("Pick the reason that fits best.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await fileReport({ targetType, targetId, reason, details });
      if (result.ok || result.error.code === "ALREADY_DONE") {
        onOpenChange(false);
        setReason("");
        setDetails("");
        toast(result.ok ? "Report sent. Moderators review reports within 24 hours." : result.error.message);
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Report ${targetType === "post" ? "post" : "account"}`}
        description={`Tell us what's wrong with ${targetLabel}. Reports are private — the account won't see who reported them.`}
      >
        <form onSubmit={submit} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Reason</legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm has-[:checked]:border-accent"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 accent-[var(--accent)]"
                />
                {r.label}
              </label>
            ))}
          </fieldset>
          <Field id={detailsId} label="Details (optional)" hint="Anything that helps a moderator understand.">
            <Textarea
              {...describedBy(detailsId, undefined, true)}
              value={details}
              maxLength={LIMITS.reportDetails}
              onChange={(e) => setDetails(e.target.value)}
            />
          </Field>
          {reason === "minor_safety" ? (
            <p className="text-sm text-muted">
              Child-safety reports go to the front of the queue. If someone is in immediate danger, contact local
              emergency services.
            </p>
          ) : null}
          <FormError message={error} />
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
