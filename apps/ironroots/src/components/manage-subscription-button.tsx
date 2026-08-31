"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ManageSubscriptionButton({ stripeSubscriptionId }: { stripeSubscriptionId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/csa/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeSubscriptionId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
        Pause / cancel
      </button>
      {error && (
        <p role="alert" className="max-w-[16rem] text-right text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
