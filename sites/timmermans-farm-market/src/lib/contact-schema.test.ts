import { describe, expect, it } from "vitest";
import { ContactSchema } from "@/lib/contact-schema";

describe("ContactSchema", () => {
  it("accepts a valid submission", () => {
    const result = ContactSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      message: "Do you have sweet corn this week?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = ContactSchema.safeParse({
      name: "",
      email: "jane@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = ContactSchema.safeParse({
      name: "Jane",
      email: "not-an-email",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = ContactSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      message: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name and email", () => {
    const result = ContactSchema.safeParse({
      name: "  Jane  ",
      email: "  jane@example.com  ",
      message: "Hello",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane");
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects a name over the length limit", () => {
    const result = ContactSchema.safeParse({
      name: "a".repeat(201),
      email: "jane@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });
});
