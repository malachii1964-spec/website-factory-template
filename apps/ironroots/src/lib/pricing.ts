/**
 * Single source of truth for anything chargeable. CSA plans are defined here
 * since they aren't in the produce catalog; per-item cart pricing comes
 * straight from products.ts via cart.ts so displayed and charged prices
 * never drift apart.
 */

export interface CsaPlan {
  id: string;
  name: string;
  /** Fixed price, or the suggested price when payWhatYouCan is set. */
  amountCents: number;
  interval: "week" | "month";
  description: string;
  boxSlug: string;
  /** Present only on the honor-system, pay-what-you-can tier. */
  payWhatYouCan?: { minCents: number; maxCents: number };
}

export const CSA_PLANS: CsaPlan[] = [
  {
    id: "csa-small-weekly",
    name: "Weekly Harvest Box — Small (CSA)",
    amountCents: 2800,
    interval: "week",
    description: "Auto-delivered every week. Pause or cancel anytime.",
    boxSlug: "weekly-harvest-box-small",
  },
  {
    id: "csa-family-weekly",
    name: "Weekly Harvest Box — Family (CSA)",
    amountCents: 4500,
    interval: "week",
    description: "Auto-delivered every week. Pause or cancel anytime.",
    boxSlug: "weekly-harvest-box-family",
  },
  {
    id: "csa-community-weekly",
    name: "Community Share — Weekly Harvest Box (CSA)",
    amountCents: 2800,
    interval: "week",
    description:
      "The same Small box, priced on the honor system. Pay what you can afford between $15 and $45 — no income verification, no questions.",
    boxSlug: "weekly-harvest-box-small",
    payWhatYouCan: { minCents: 1500, maxCents: 4500 },
  },
];

export function getCsaPlan(id: string): CsaPlan | undefined {
  return CSA_PLANS.find((p) => p.id === id);
}

/** Clamps a customer-chosen amount into a plan's honor-system range. */
export function clampToPayWhatYouCan(plan: CsaPlan, amountCents: number): number {
  if (!plan.payWhatYouCan) return plan.amountCents;
  const { minCents, maxCents } = plan.payWhatYouCan;
  return Math.min(maxCents, Math.max(minCents, Math.round(amountCents)));
}

export const DONATION_PRESETS_CENTS = [500, 1000, 2500];
