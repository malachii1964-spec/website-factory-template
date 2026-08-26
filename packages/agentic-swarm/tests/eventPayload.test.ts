import { describe, expect, it } from "vitest";
import { incomingEventSchema } from "../src/eventPayload.schema.js";

describe("incomingEventSchema", () => {
  it("accepts a well-formed webhook payload", () => {
    const result = incomingEventSchema.safeParse({
      eventId: "evt_1",
      route: "https://example.com/checkout",
      customerText: "Checkout crashes on mobile",
      repoPath: "/repo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL route", () => {
    const result = incomingEventSchema.safeParse({
      eventId: "evt_1",
      route: "not-a-url",
      customerText: "broken",
      repoPath: "/repo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty eventId", () => {
    const result = incomingEventSchema.safeParse({
      eventId: "",
      route: "https://example.com",
      customerText: "broken",
      repoPath: "/repo",
    });
    expect(result.success).toBe(false);
  });
});
