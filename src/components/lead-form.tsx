"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function LeadForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("done");
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
      setStatus("idle");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-active/30 bg-active-tint px-5 py-4 text-active">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Check your inbox — your free starter prompts are on the way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="lead-email" className="sr-only">
          Email address
        </label>
        <input
          id="lead-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={buttonVariants({ size: "lg" })}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Sending…
            </>
          ) : (
            "Send my free prompts"
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        No spam, ever. Unsubscribe in one click.
      </p>
    </form>
  );
}
