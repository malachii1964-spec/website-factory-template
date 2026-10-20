import { describe, expect, it } from "vitest";
import { fromDbError } from "./errors";
import {
  createPostSchema,
  fieldErrors,
  reportSchema,
  safeNextPath,
  signUpSchema,
  username,
} from "./validation";

const member = "8292a1f8-8c80-47ca-8036-bbc2ea5df396";
const photo = "0b1e7a3c-2f4d-4c5e-8a9b-1c2d3e4f5a6b";

describe("signUpSchema", () => {
  const valid = {
    email: " Grower@Example.com ",
    password: "frostybuds42",
    username: "Night_Grower",
    displayName: "Night Grower",
    birthDate: "1990-04-20",
    acceptTerms: true,
  };

  it("normalizes email and username", () => {
    const parsed = signUpSchema.parse(valid);
    expect(parsed.email).toBe("grower@example.com");
    expect(parsed.username).toBe("night_grower");
  });

  it("rejects under-21 sign-ups with a clear message", () => {
    const result = signUpSchema.safeParse({ ...valid, birthDate: "2015-01-01" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).birthDate).toMatch(/21 or older/);
  });

  it("requires accepting the terms", () => {
    const result = signUpSchema.safeParse({ ...valid, acceptTerms: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).acceptTerms).toMatch(/Accept the Terms/);
  });

  it("requires letters and digits in passwords", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "onlyletterslong" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "short1" }).success).toBe(false);
  });
});

describe("username", () => {
  it("rejects reserved and malformed names", () => {
    expect(username.safeParse("Admin").success).toBe(false);
    expect(username.safeParse("ab").success).toBe(false);
    expect(username.safeParse("has space").success).toBe(false);
    expect(username.safeParse("grower_420").success).toBe(true);
  });
});

describe("createPostSchema", () => {
  it("needs text or a photo", () => {
    expect(createPostSchema.safeParse({ body: "   ", media: [] }).success).toBe(false);
    expect(
      createPostSchema.safeParse({ body: "", media: [{ path: `${member}/${photo}.webp`, w: 10, h: 10 }] })
        .success,
    ).toBe(true);
  });

  it("caps length, photo count and checks media paths", () => {
    expect(createPostSchema.safeParse({ body: "x".repeat(501) }).success).toBe(false);
    const five = Array.from({ length: 5 }, () => ({ path: `${member}/${photo}.webp`, w: 1, h: 1 }));
    expect(createPostSchema.safeParse({ body: "hi", media: five }).success).toBe(false);
    expect(
      createPostSchema.safeParse({ body: "hi", media: [{ path: "../../etc/passwd", w: 1, h: 1 }] }).success,
    ).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts known reasons only", () => {
    expect(reportSchema.safeParse({ targetType: "post", targetId: member, reason: "sale" }).success).toBe(true);
    expect(reportSchema.safeParse({ targetType: "post", targetId: member, reason: "meh" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("only allows same-origin paths", () => {
    expect(safeNextPath("/u/grower")).toBe("/u/grower");
    expect(safeNextPath("//evil.com")).toBe("/home");
    expect(safeNextPath("https://evil.com")).toBe("/home");
    expect(safeNextPath("/\\evil.com")).toBe("/home");
    expect(safeNextPath(undefined, "/")).toBe("/");
  });
});

describe("fromDbError", () => {
  it("maps database GL codes to member-friendly messages", () => {
    expect(fromDbError({ code: "P0001", message: "GL_RATE_LIMITED" }).error.code).toBe("GL_RATE_LIMITED");
    expect(fromDbError({ code: "23505", message: "duplicate key" }).error.code).toBe("ALREADY_DONE");
    expect(fromDbError(new Error("boom")).error.code).toBe("UNKNOWN");
  });
});
