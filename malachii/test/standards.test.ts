import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testStore } from "./helpers.ts";
import type { MemoryStore } from "../src/memory/store.ts";
import {
  VOLATILITY_DAYS,
  isQuarantined,
  isStale,
  isUsable,
  lookupStandards,
  recordStandard,
  refreshStandard,
  staleStandards,
  trustStandard,
} from "../src/knowledge/standards.ts";

const DAY = 86_400_000;

let store: MemoryStore;
beforeEach(() => {
  store = testStore();
});
afterEach(() => {
  store.close();
});

describe("recordStandard", () => {
  it("quarantines anything that did not come from Malachi himself", async () => {
    const standard = await recordStandard(store, {
      claim: "Next.js 16 is the current stable release",
      scope: "scaffolding a new Next.js app",
      source: "https://nextjs.org/blog",
    });
    expect(isQuarantined(standard)).toBe(true);
    expect(isUsable(standard)).toBe(false);
  });

  it("trusts a standard Malachi states himself, because there is nothing left to vouch for it", async () => {
    const standard = await recordStandard(store, {
      claim: "dark mode is the default theme",
      scope: "any site in this project",
      source: "owner's decision",
      trusted: true,
    });
    expect(isQuarantined(standard)).toBe(false);
    expect(isUsable(standard)).toBe(true);
  });

  it("sets the expiry from how fast the subject actually moves", async () => {
    const now = Date.now();
    const fast = await recordStandard(store, {
      claim: "a", scope: "model names", source: "s", volatility: "fast", now,
    });
    const slow = await recordStandard(store, {
      claim: "b", scope: "colour contrast ratios", source: "s", volatility: "slow", now,
    });
    expect(fast.staleAfter).toBe(now + VOLATILITY_DAYS.fast * DAY);
    expect(slow.staleAfter).toBe(now + VOLATILITY_DAYS.slow * DAY);
  });
});

describe("expiry", () => {
  it("refuses a standard past its deadline however trusted it was", async () => {
    const now = Date.now();
    const standard = await recordStandard(store, {
      claim: "React 18 is current",
      scope: "picking a React version",
      source: "https://react.dev",
      volatility: "fast",
      trusted: true,
      now,
    });
    const later = now + (VOLATILITY_DAYS.fast + 1) * DAY;
    expect(isUsable(standard, now)).toBe(true);
    expect(isStale(standard, later)).toBe(true);
    expect(isUsable(standard, later)).toBe(false);
  });

  it("lists only expired standards as the refresh queue", async () => {
    const now = Date.now();
    await recordStandard(store, {
      claim: "old", scope: "expired thing", source: "s", volatility: "fast", now,
    });
    await recordStandard(store, {
      claim: "new", scope: "fresh thing", source: "s", volatility: "slow", now,
    });
    const overdue = staleStandards(store, now + (VOLATILITY_DAYS.fast + 1) * DAY);
    expect(overdue).toHaveLength(1);
    expect(overdue[0]!.body).toBe("old");
  });
});

describe("trustStandard", () => {
  it("takes a standard out of quarantine without touching its confidence", async () => {
    const standard = await recordStandard(store, {
      claim: "Tailwind v4 is current",
      scope: "styling a new app",
      source: "https://tailwindcss.com",
    });
    const before = standard.confidence;
    const vouched = trustStandard(store, standard.id);
    expect(isQuarantined(vouched!)).toBe(false);
    // Quarantine and confidence answer different questions; vouching must not
    // silently inflate belief.
    expect(vouched!.confidence).toBe(before);
  });

  it("is a no-op on a standard that was never quarantined", async () => {
    const standard = await recordStandard(store, {
      claim: "x", scope: "y", source: "z", trusted: true,
    });
    expect(trustStandard(store, standard.id)!.id).toBe(standard.id);
  });
});

describe("lookupStandards", () => {
  it("separates what can gate work from what cannot, and says why", async () => {
    const now = Date.now();
    await recordStandard(store, {
      claim: "use semantic landmarks and a visible focus ring",
      scope: "accessibility on a public web page",
      source: "https://www.w3.org/WAI/WCAG22/quickref/",
      volatility: "slow",
      trusted: true,
      now,
    });
    await recordStandard(store, {
      claim: "an unvouched claim about accessibility on a public web page",
      scope: "accessibility on a public web page",
      source: "https://random-blog.example",
      volatility: "slow",
      now,
    });

    const found = await lookupStandards(store, "accessibility on a public web page", { now });
    expect(found.usable).toHaveLength(1);
    expect(found.usable[0]!.body).toContain("semantic landmarks");
    expect(found.unusable).toHaveLength(1);
    expect(found.unusable[0]!.reason).toBe("quarantined");
  });

  it("returns nothing for a scope the shelf has never covered", async () => {
    const found = await lookupStandards(store, "quantum error correction thresholds");
    expect(found.usable).toEqual([]);
    expect(found.unusable).toEqual([]);
  });

  it("does not offer an unrelated standard just because it is the only one on the shelf", async () => {
    // Caught live: the scorer is additive, so an irrelevant memory still scores
    // ~0.4 on priors, and recall's candidate pool always includes recent rows
    // whether they matched or not. Asking about an unresearched subject returned
    // the newest standard — which would gate a build against a rule from a
    // completely different subject.
    await recordStandard(store, {
      claim: "Next.js 16 with App Router is the current stable baseline",
      scope: "scaffolding a new Next.js site",
      source: "https://nextjs.org/blog",
      trusted: true,
    });

    const found = await lookupStandards(store, "choosing a database migration tool");
    expect(found.usable).toEqual([]);
    expect(found.unusable).toEqual([]);
  });

  it("still matches a scope worded differently from how it was shelved", async () => {
    await recordStandard(store, {
      claim: "every interactive control needs a visible focus ring",
      scope: "accessibility on a public web page",
      source: "https://www.w3.org/WAI/WCAG22/quickref/",
      trusted: true,
    });
    const found = await lookupStandards(store, "web page accessibility");
    expect(found.usable).toHaveLength(1);
  });
});

describe("refreshStandard", () => {
  it("extends the deadline in place when the claim still holds", async () => {
    const now = Date.now();
    const standard = await recordStandard(store, {
      claim: "Postgres 17 is the current major",
      scope: "choosing a Postgres version",
      source: "https://postgresql.org",
      volatility: "medium",
      trusted: true,
      now,
    });
    const later = now + 200 * DAY;
    const refreshed = await refreshStandard(store, standard.id, {
      claim: "Postgres 17 is the current major",
      source: "https://postgresql.org/support/versioning",
      now: later,
    });
    expect(refreshed!.id).toBe(standard.id);
    expect(refreshed!.staleAfter).toBe(later + VOLATILITY_DAYS.medium * DAY);
    expect(isStale(refreshed!, later)).toBe(false);
    // It kept its vouched status because the claim never changed.
    expect(isQuarantined(refreshed!)).toBe(false);
  });

  it("supersedes and re-quarantines when the claim actually changed", async () => {
    const now = Date.now();
    const standard = await recordStandard(store, {
      claim: "Postgres 17 is the current major",
      scope: "choosing a Postgres version",
      source: "https://postgresql.org",
      trusted: true,
      now,
    });
    const replacement = await refreshStandard(store, standard.id, {
      claim: "Postgres 18 is the current major",
      source: "https://postgresql.org",
      now: now + 200 * DAY,
    });

    expect(replacement!.id).not.toBe(standard.id);
    expect(replacement!.body).toContain("18");
    // A changed claim is a new claim: it must earn trust again rather than
    // inheriting it from the standard it replaced.
    expect(isQuarantined(replacement!)).toBe(true);
    // The old belief stays readable rather than being edited away.
    expect(store.get(standard.id)!.status).toBe("superseded");
    expect(store.get(standard.id)!.body).toContain("17");
  });

  it("returns null for an id that does not exist", async () => {
    expect(await refreshStandard(store, "std_nope", { claim: "x", source: "y" })).toBeNull();
  });
});
