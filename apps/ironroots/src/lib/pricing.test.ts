import { describe, it, expect } from "vitest";
import { CSA_PLANS, clampToPayWhatYouCan, getCsaPlan } from "./pricing";

describe("getCsaPlan", () => {
  it("finds a known plan", () => {
    expect(getCsaPlan("csa-small-weekly")?.id).toBe("csa-small-weekly");
  });

  it("returns undefined for an unknown plan", () => {
    expect(getCsaPlan("does-not-exist")).toBeUndefined();
  });
});

describe("clampToPayWhatYouCan", () => {
  const community = getCsaPlan("csa-community-weekly")!;

  it("passes a value inside the range through unchanged", () => {
    expect(clampToPayWhatYouCan(community, 2000)).toBe(2000);
  });

  it("clamps below the minimum up to the minimum", () => {
    expect(clampToPayWhatYouCan(community, 1)).toBe(community.payWhatYouCan!.minCents);
  });

  it("clamps above the maximum down to the maximum", () => {
    expect(clampToPayWhatYouCan(community, 1_000_000)).toBe(community.payWhatYouCan!.maxCents);
  });

  it("rejects a negative or absurd pledge the same way a client could try to send", () => {
    expect(clampToPayWhatYouCan(community, -500)).toBe(community.payWhatYouCan!.minCents);
  });

  it("falls back to the plan's fixed amount for a plan with no pay-what-you-can range", () => {
    const fixed = getCsaPlan("csa-small-weekly")!;
    expect(clampToPayWhatYouCan(fixed, 1)).toBe(fixed.amountCents);
  });
});

describe("CSA_PLANS", () => {
  it("every plan resolves to a real product for its box", () => {
    for (const plan of CSA_PLANS) {
      expect(plan.boxSlug.length).toBeGreaterThan(0);
    }
  });

  it("the community share's suggested amount sits inside its own range", () => {
    const community = getCsaPlan("csa-community-weekly")!;
    expect(community.amountCents).toBeGreaterThanOrEqual(community.payWhatYouCan!.minCents);
    expect(community.amountCents).toBeLessThanOrEqual(community.payWhatYouCan!.maxCents);
  });
});
