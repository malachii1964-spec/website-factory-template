import { describe, expect, it } from "vitest";
import { tokenize } from "../src/cli/mal.ts";

describe("tokenize", () => {
  it("splits plain text on whitespace", () => {
    expect(tokenize("recall stripe webhook")).toEqual(["recall", "stripe", "webhook"]);
  });

  it("keeps a double-quoted argument as one token", () => {
    expect(tokenize('remember "ship it" --tags smoke')).toEqual([
      "remember",
      "ship it",
      "--tags",
      "smoke",
    ]);
  });

  it("keeps a single-quoted argument as one token", () => {
    expect(tokenize("learn 'always confirm' --when 'on success'")).toEqual([
      "learn",
      "always confirm",
      "--when",
      "on success",
    ]);
  });

  it("returns an empty array for a blank line", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});
