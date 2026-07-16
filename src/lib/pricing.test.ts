import { describe, it, expect } from "vitest";
import { getChargeable, membershipPlans, bundlePlans } from "./pricing";
import { products } from "./products";

describe("getChargeable", () => {
  it("returns null for an unknown id", () => {
    expect(getChargeable("does-not-exist")).toBeNull();
  });

  it("charges the exact catalog price for every product (no display/charge drift)", () => {
    // This is the bug the old build had: a separate Stripe price map that
    // disagreed with the displayed price. Guard it forever.
    for (const p of products) {
      const c = getChargeable(p.slug);
      expect(c, `missing chargeable for ${p.slug}`).not.toBeNull();
      expect(c!.amountCents).toBe(Math.round(p.price * 100));
      expect(c!.mode).toBe("payment");
    }
  });

  it("treats membership as a recurring subscription with an interval", () => {
    for (const plan of membershipPlans) {
      const c = getChargeable(plan.id);
      expect(c).not.toBeNull();
      expect(c!.mode).toBe("subscription");
      expect(["month", "year"]).toContain(c!.interval);
    }
  });

  it("treats bundles as one-time payments", () => {
    for (const b of bundlePlans) {
      const c = getChargeable(b.id);
      expect(c).not.toBeNull();
      expect(c!.mode).toBe("payment");
      expect(c!.amountCents).toBeGreaterThan(0);
    }
  });
});
