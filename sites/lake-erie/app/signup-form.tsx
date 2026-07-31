"use client";

import { useState } from "react";

type State = { status: "idle" | "sending" | "done" | "error"; message?: string };

/**
 * The page has exactly one job, and this is it.
 *
 * No product, no prices, no cart — the licensing position is unresolved, so the
 * only honest ask on this page is "tell me when there is something to tell".
 */
export function SignupForm() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [email, setEmail] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setState({
          status: "error",
          message: data.error ?? "That did not go through. Try again in a moment.",
        });
        return;
      }
      setState({ status: "done" });
    } catch {
      setState({
        status: "error",
        message: "No connection. Check your network and try again.",
      });
    }
  }

  if (state.status === "done") {
    return (
      <p
        className="rounded-sm border border-living/40 bg-living/10 px-4 py-3 text-limestone"
        role="status"
      >
        You&rsquo;re on the list. You&rsquo;ll hear from us when there are cuttings
        ready — and not for anything else.
      </p>
    );
  }

  return (
    // flex-wrap matters: the error message below asks for basis-full, and in a
    // non-wrapping row that crushed the input down to a sliver instead of
    // taking its own line.
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" noValidate>
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={state.status === "error"}
        aria-describedby={state.status === "error" ? "email-error" : undefined}
        className="min-w-0 flex-1 rounded-sm border border-haze/30 bg-shallows/60 px-4 py-3 text-limestone placeholder:text-haze/50 focus:border-amber"
      />
      <button
        type="submit"
        disabled={state.status === "sending"}
        className="field-label shrink-0 rounded-sm bg-amber px-6 py-3 text-deep transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state.status === "sending" ? "Adding you…" : "Tell me when it's ready"}
      </button>
      {state.status === "error" ? (
        // basis-full, not sm:sr-only: hiding the error above 640px left sighted
        // desktop users staring at a form that had silently refused them.
        <p id="email-error" role="alert" className="basis-full text-sm text-amber">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
