"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BuyButton({
  productId,
  label,
  className,
  size = "lg",
}: {
  productId: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
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
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className={buttonVariants({ size, className: "w-full sm:w-auto" })}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Starting checkout…
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
