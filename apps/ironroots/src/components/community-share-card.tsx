"use client";

import { useState } from "react";
import type { CsaPlan } from "@/lib/pricing";
import { CsaSubscribeButton } from "@/components/csa-subscribe-button";

export function CommunityShareCard({ plan }: { plan: CsaPlan }) {
  const range = plan.payWhatYouCan;
  const [dollars, setDollars] = useState(Math.round(plan.amountCents / 100));

  if (!range) return null;
  const minDollars = range.minCents / 100;
  const maxDollars = range.maxCents / 100;

  return (
    <div className="panel border-leaf/40 bg-leaf-tint/40 p-6">
      <h2 className="font-display text-xl font-medium text-foreground">Community Share</h2>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

      <label htmlFor="pledge-amount" className="mt-5 block text-sm font-medium text-foreground">
        What you&rsquo;ll pay each week
      </label>
      <div className="mt-2 flex items-center gap-4">
        <span className="text-3xl font-semibold text-foreground">${dollars}</span>
        <input
          id="pledge-amount"
          type="range"
          min={minDollars}
          max={maxDollars}
          step={1}
          value={dollars}
          onChange={(e) => setDollars(Number(e.target.value))}
          className="flex-1 accent-leaf"
          aria-label="Weekly amount you'll pay for the Community Share"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>${minDollars}</span>
        <span>${maxDollars}+ (helps fund another family&rsquo;s share)</span>
      </div>

      <div className="mt-5">
        <CsaSubscribeButton
          planId={plan.id}
          pledgeCents={dollars * 100}
          label={`Subscribe — $${dollars}/week`}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        No income verification, no application, no judgment. Pick a number
        that works for your household.
      </p>
    </div>
  );
}
