import { describe, expect, it } from "vitest";
import { cosine, fromBlob, LocalEmbedder, toBlob, tokenize } from "../src/memory/embed.ts";

const embedder = new LocalEmbedder();

describe("tokenize", () => {
  it("drops stop words and adds bigrams", () => {
    const grams = tokenize("The deploy failed on Vercel");
    expect(grams).toContain("deploy");
    expect(grams).not.toContain("the");
    expect(grams.some((g) => g.includes("~"))).toBe(true);
  });

  it("collapses simple inflections so plurals match singulars", () => {
    expect(tokenize("deploys")).toEqual(tokenize("deploy"));
  });
});

describe("LocalEmbedder", () => {
  it("is deterministic — the same text always gives the same vector", () => {
    const a = embedder.embedOne("Stripe webhooks must verify the signature");
    const b = embedder.embedOne("Stripe webhooks must verify the signature");
    // float32 storage, so identity holds to ~7 significant figures, not 10.
    expect(cosine(a, b)).toBeCloseTo(1, 6);
  });

  it("produces unit vectors, so cosine is a plain dot product", () => {
    const vec = embedder.embedOne("a reasonably long sentence about databases and indexes");
    const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("scores related text above unrelated text", () => {
    const query = embedder.embedOne("the stripe webhook signature check failed");
    const related = embedder.embedOne("stripe webhook signature verification broke again");
    const unrelated = embedder.embedOne("the kitchen renovation needs new cabinet hinges");
    expect(cosine(query, related)).toBeGreaterThan(cosine(query, unrelated));
  });

  it("returns a zero vector for empty input instead of throwing", () => {
    const vec = embedder.embedOne("   ");
    expect(vec.every((x) => x === 0)).toBe(true);
    expect(cosine(vec, vec)).toBe(0);
  });

  it("survives a round trip through the SQLite blob format", () => {
    const original = embedder.embedOne("round trip through storage");
    const restored = fromBlob(toBlob(original));
    expect(restored.length).toBe(original.length);
    expect(cosine(original, restored)).toBeCloseTo(1, 6);
  });
});
