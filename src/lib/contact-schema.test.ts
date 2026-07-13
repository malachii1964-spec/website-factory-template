import { describe, it, expect } from "vitest";
import { contactSchema, isHoneypotTripped } from "./contact-schema";

const valid = {
  name: "Jane Gardener",
  email: "Jane@Example.com ",
  phone: "(716) 555-0142",
  topic: "Plant availability",
  message: "Do you have heirloom tomato starts available this weekend?",
};

describe("contactSchema", () => {
  it("accepts a well-formed submission and normalizes email", () => {
    const r = contactSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("jane@example.com"); // trimmed + lowercased
      expect(r.data.name).toBe("Jane Gardener");
    }
  });

  it("rejects a short name, bad email, and short message", () => {
    const r = contactSchema.safeParse({ name: "J", email: "nope", message: "hey" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = r.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("name");
      expect(fields).toContain("email");
      expect(fields).toContain("message");
    }
  });

  it("strips the honeypot field rather than rejecting (so real users aren't blocked)", () => {
    const r = contactSchema.safeParse({ ...valid, company: "autofilled" });
    expect(r.success).toBe(true);
    if (r.success) expect("company" in r.data).toBe(false);
  });

  it("detects a tripped honeypot separately", () => {
    expect(isHoneypotTripped({ company: "spamco" })).toBe(true);
    expect(isHoneypotTripped({ company: "" })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });

  it("allows an empty optional phone", () => {
    const r = contactSchema.safeParse({ ...valid, phone: "" });
    expect(r.success).toBe(true);
  });

  it("defaults the topic when omitted", () => {
    const { topic: _omit, ...rest } = valid;
    void _omit;
    const r = contactSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.topic).toBe("General question");
  });
});
