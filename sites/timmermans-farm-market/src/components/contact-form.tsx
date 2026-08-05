"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("done");
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
      setStatus("idle");
    } catch {
      setError("Network error. Please try again, or give us a call.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-crate/30 bg-crate/10 px-5 py-4 text-crate-deep">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">
          Thanks — we&rsquo;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium text-espresso">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-12 w-full rounded-md border border-cream-line bg-paper px-4 text-sm text-espresso outline-none placeholder:text-espresso-soft/50 focus-visible:border-barn"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="text-sm font-medium text-espresso">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="mt-1 h-12 w-full rounded-md border border-cream-line bg-paper px-4 text-sm text-espresso outline-none placeholder:text-espresso-soft/50 focus-visible:border-barn"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="text-sm font-medium text-espresso">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-cream-line bg-paper px-4 py-3 text-sm text-espresso outline-none placeholder:text-espresso-soft/50 focus-visible:border-barn"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-barn px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-barn-deep disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          "Send message"
        )}
      </button>
      {error && (
        <p role="alert" className="text-sm text-barn-deep">
          {error}
        </p>
      )}
    </form>
  );
}
