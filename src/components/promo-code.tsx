"use client";

/**
 * Click-to-copy discount code.
 *
 * The promo art already shows the code, but text baked into an image cannot be
 * copied, read by a screen reader, or found by search. This renders it as real
 * text and makes taking it a single tap — the one interaction that decides
 * whether a code actually gets used at checkout.
 *
 * Clipboard access can be denied (insecure context, permissions, older
 * browsers), so a failure falls back to selecting the code for manual copy
 * rather than pretending it worked.
 */

import { useRef, useState } from "react";

type State = "idle" | "copied" | "manual";

export function PromoCode({ code, label }: { code: string; label?: string }) {
  const [state, setState] = useState<State>("idle");
  const codeRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      // Select it so the grower can copy by hand instead of losing the code.
      const el = codeRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setState("manual");
    }
    timer.current = setTimeout(() => setState("idle"), 2600);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy discount code ${code}${label ? ` for ${label}` : ""}`}
        className="group flex items-center justify-between gap-3 rounded-xl border border-lime/35 bg-lime/[0.06] px-3.5 py-2.5 text-left transition hover:border-lime/60 hover:bg-lime/[0.1] focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <span className="min-w-0">
          <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-frost-dim">
            Code
          </span>
          <code
            ref={codeRef}
            className="block truncate font-mono text-base font-semibold tracking-[0.08em] text-lime"
          >
            {code}
          </code>
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim transition group-hover:text-frost">
          {state === "copied" ? "Copied ✓" : state === "manual" ? "Selected" : "Copy"}
        </span>
      </button>

      {/* Announced to screen readers without shifting layout. */}
      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? `Code ${code} copied to clipboard`
          : state === "manual"
            ? `Code ${code} selected — press Control or Command C to copy`
            : ""}
      </span>

      {state === "manual" ? (
        <p className="font-mono text-[10px] leading-relaxed text-gold">
          Couldn&apos;t reach your clipboard — the code is selected, press
          ⌘/Ctrl+C.
        </p>
      ) : null}
    </div>
  );
}
