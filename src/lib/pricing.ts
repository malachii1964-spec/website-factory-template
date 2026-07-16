import { getProductBySlug } from "@/lib/products";

/**
 * Single source of truth for anything chargeable.
 *
 * Product prices come straight from products.ts (what the customer sees) so
 * the displayed price and the charged price can never drift apart — the old
 * Manus build had a separate Stripe price map that disagreed with the catalog.
 *
 * Bundles and membership aren't in the catalog, so they're defined here.
 */

export interface Chargeable {
  id: string;
  name: string;
  amountCents: number;
  mode: "payment" | "subscription";
  interval?: "month" | "year";
  description?: string;
}

const BUNDLES: Record<string, Omit<Chargeable, "id" | "mode">> = {
  "starter-bundle": {
    name: "The Complete AI Starter Kit",
    amountCents: 4900,
    description: "Prompt Vault + EASY AI Book + AI-First E-Book.",
  },
  "content-creator-bundle": {
    name: "The Content Creator Bundle",
    amountCents: 5900,
    description: "Graphics Pack + Content Machine + Midjourney Prompts.",
  },
  "prompt-master-bundle": {
    name: "The Prompt Master Bundle",
    amountCents: 8900,
    description: "All 4 Prompt Libraries + Prompt Engineering E-Book.",
  },
  "local-business-bundle": {
    name: "The Local Business Dominator Bundle",
    amountCents: 12900,
    description: "Any Industry Kit + Playbook + Course.",
  },
  "full-vault": {
    name: "The Full FutureDeskAI Vault",
    amountCents: 49700,
    description: "Every product — lifetime access.",
  },
};

const MEMBERSHIP: Record<string, Omit<Chargeable, "id" | "mode">> = {
  "inner-circle-monthly": {
    name: "FutureDesk Inner Circle — Monthly",
    amountCents: 2900,
    interval: "month",
    description: "Monthly access to the exclusive Inner Circle.",
  },
  "inner-circle-annual": {
    name: "FutureDesk Inner Circle — Annual",
    amountCents: 29900,
    interval: "year",
    description: "Annual access to the Inner Circle (save 14%).",
  },
};

export function getChargeable(id: string): Chargeable | null {
  const product = getProductBySlug(id);
  if (product) {
    return {
      id,
      name: product.title,
      amountCents: Math.round(product.price * 100),
      mode: "payment",
      description: product.description,
    };
  }
  if (BUNDLES[id]) {
    return { id, mode: "payment", ...BUNDLES[id] };
  }
  if (MEMBERSHIP[id]) {
    const m = MEMBERSHIP[id];
    return { id, mode: "subscription", ...m };
  }
  return null;
}

export const membershipPlans = Object.entries(MEMBERSHIP).map(([id, m]) => ({
  id,
  ...m,
}));

export const bundlePlans = Object.entries(BUNDLES).map(([id, b]) => ({
  id,
  ...b,
}));
