import { describe, it, expect } from "vitest";
import { formatPhone, telHref, smsHref } from "./site";
import { allServices, serviceGroups } from "./services";

describe("formatPhone", () => {
  it("formats a 10-digit string", () => {
    expect(formatPhone("7165550176")).toBe("(716) 555-0176");
  });
  it("strips non-digits before formatting", () => {
    expect(formatPhone("716-555-0176")).toBe("(716) 555-0176");
  });
  it("returns the input unchanged when it isn't 10 digits", () => {
    expect(formatPhone("555")).toBe("555");
  });
});

describe("tel/sms hrefs", () => {
  it("builds an E.164-ish tel link", () => {
    expect(telHref("716-555-0176")).toBe("tel:+17165550176");
  });
  it("builds an sms link", () => {
    expect(smsHref("(716) 555-0176")).toBe("sms:+17165550176");
  });
});

describe("services data", () => {
  it("exposes all 8 services across the groups", () => {
    expect(allServices).toHaveLength(8);
  });
  it("has unique service ids", () => {
    const ids = allServices.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("groups into everyday / recurring / business", () => {
    expect(serviceGroups.map((g) => g.key)).toEqual(["everyday", "recurring", "business"]);
  });
});
