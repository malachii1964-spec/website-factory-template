"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };
const listeners = new Set<(t: Toast) => void>();
let nextId = 1;

/** Show a short status message in the global live region. */
export function toast(message: string) {
  const t = { id: nextId++, message };
  listeners.forEach((fn) => fn(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (t: Toast) => {
      setToasts((all) => [...all.slice(-2), t]);
      setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), 5000);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 lg:bottom-8"
    >
      {toasts.map((t) => (
        <p
          key={t.id}
          className="pointer-events-auto max-w-md rounded-xl border border-border-strong bg-surface-2 px-4 py-3 text-sm shadow-2xl"
        >
          {t.message}
        </p>
      ))}
    </div>
  );
}
