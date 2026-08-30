"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CsaSubscribeButton({
  planId,
  label,
  pledgeCents,
}: {
  planId: string;
  label: string;
  pledgeCents?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/csa/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, ...(pledgeCents !== undefined && { pledgeCents }) }),
      });
      const data = (await res.json()) as { url?: string; error?: string; code?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.code === "unauthenticated") {
        router.push("/account");
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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={subscribe}
        disabled={loading}
        className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Starting…
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
