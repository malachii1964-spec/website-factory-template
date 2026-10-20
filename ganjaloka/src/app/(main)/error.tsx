"use client";

import { Button } from "@/components/ui/button";

export default function MainError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted">We couldn&apos;t load this page. Check your connection and try again.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
