import { describe, expect, it } from "vitest";
import { chunkText, htmlToText } from "../src/memory/ingest.ts";

describe("chunkText", () => {
  it("keeps chunks under the ceiling", () => {
    const text = Array.from({ length: 60 }, (_, i) => `Paragraph ${i}. ${"word ".repeat(40)}`).join("\n\n");
    const chunks = chunkText(text, { maxChars: 600, overlapChars: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(700);
  });

  it("splits an oversized paragraph on sentence boundaries", () => {
    const text = `${"This is one sentence. ".repeat(200)}`;
    const chunks = chunkText(text, { maxChars: 500, overlapChars: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(600);
  });

  it("drops fragments too short to be worth recalling", () => {
    expect(chunkText("hi\n\nok\n\nno")).toEqual([]);
  });

  it("returns nothing for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });
});

describe("htmlToText", () => {
  it("drops scripts and styles rather than indexing them", () => {
    const text = htmlToText(
      "<html><head><style>.a{color:red}</style></head><body><script>alert(1)</script><p>Real content here.</p></body></html>",
    );
    expect(text).toContain("Real content here.");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("color:red");
  });

  it("turns block elements into paragraph breaks", () => {
    expect(htmlToText("<p>One</p><p>Two</p>")).toBe("One\n\nTwo");
  });

  it("decodes the entities that actually show up in prose", () => {
    expect(htmlToText("<p>Tom &amp; Jerry &lt;3 &quot;quotes&quot;</p>")).toContain('Tom & Jerry <3 "quotes"');
  });
});
