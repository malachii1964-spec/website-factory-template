import { describe, it, expect } from "vitest";
import { requestSchema } from "./request-schema";

const valid = {
  name: "Mary Jones",
  phone: "716-555-0100",
  requestType: "Delivery" as const,
  timing: "As soon as possible" as const,
  pickup: "Westfield Pharmacy",
  dropoff: "12 Elm St",
  details: "Pick up a prescription and bring it to me.",
  company: "",
};

describe("requestSchema", () => {
  it("accepts a complete valid request", () => {
    expect(requestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing name", () => {
    const r = requestSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a too-short phone", () => {
    const r = requestSchema.safeParse({ ...valid, phone: "123" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown request type", () => {
    const r = requestSchema.safeParse({ ...valid, requestType: "Rocket launch" });
    expect(r.success).toBe(false);
  });

  it("treats a filled honeypot as invalid", () => {
    const r = requestSchema.safeParse({ ...valid, company: "spam-bot" });
    expect(r.success).toBe(false);
  });

  it("allows empty optional pickup/dropoff", () => {
    const r = requestSchema.safeParse({ ...valid, pickup: "", dropoff: "" });
    expect(r.success).toBe(true);
  });
});
