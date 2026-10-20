import { describe, expect, it } from "vitest";
import { decideGate } from "./gate";

const visitor = { isMember: false, hasAgeCookie: false, search: "" };

describe("decideGate", () => {
  it("sends visitors without the age cookie to the age gate, remembering where they were going", () => {
    expect(decideGate({ ...visitor, path: "/u/night_grower", search: "?tab=posts" })).toEqual({
      action: "redirect",
      to: "/age?next=%2Fu%2Fnight_grower%3Ftab%3Dposts",
    });
  });

  it("keeps legal, contact, the gate and email links reachable without the cookie", () => {
    for (const path of ["/age", "/legal/terms", "/legal/privacy", "/contact", "/auth/confirm"]) {
      expect(decideGate({ ...visitor, path })).toEqual({ action: "next" });
    }
  });

  it("does not treat lookalike paths as ungated", () => {
    expect(decideGate({ ...visitor, path: "/agent" }).action).toBe("redirect");
    expect(decideGate({ ...visitor, path: "/legalese" }).action).toBe("redirect");
  });

  it("lets age-confirmed visitors browse public pages", () => {
    expect(decideGate({ ...visitor, hasAgeCookie: true, path: "/explore" })).toEqual({ action: "next" });
  });

  it("requires login for member-only pages", () => {
    expect(decideGate({ ...visitor, hasAgeCookie: true, path: "/settings" })).toEqual({
      action: "redirect",
      to: "/login?next=%2Fsettings",
    });
  });

  it("sends members past the landing, auth pages and gate", () => {
    for (const path of ["/", "/login", "/signup", "/age"]) {
      expect(decideGate({ ...visitor, isMember: true, path })).toEqual({ action: "redirect", to: "/home" });
    }
    expect(decideGate({ ...visitor, isMember: true, path: "/mod" })).toEqual({ action: "next" });
  });
});
