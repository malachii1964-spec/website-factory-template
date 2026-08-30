/**
 * Single source of truth for anything chargeable. CSA plans are defined here
 * since they aren't in the produce catalog; per-item cart pricing comes
 * straight from products.ts via cart.ts so displayed and charged prices
 * never drift apart.
 */

export interface CsaPlan {
  id: string;
  name: string;
  amountCents: number;
  interval: "week" | "month";
  description: string;
  boxSlug: string;
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
];

export function getCsaPlan(id: string): CsaPlan | undefined {
  return CSA_PLANS.find((p) => p.id === id);
}
