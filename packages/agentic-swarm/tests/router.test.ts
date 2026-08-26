import { describe, expect, it } from "vitest";
import { route } from "../src/router.js";
import { initialState } from "../src/types.js";
import type { IncomingEvent, SwarmState } from "../src/types.js";

const event: IncomingEvent = { eventId: "e1", route: "https://example.com/checkout", customerText: "broken", repoPath: "/repo" };

describe("route()", () => {
  it("is pure — never mutates the state it is given", () => {
    const state = { ...initialState(event), phase: "SANDBOXED" as const, retryCount: 1, maxRetries: 3, sandboxResult: { exitCode: 1, logs: "", diff: null, assertionPassed: false } };
    const before = JSON.stringify(state);
    route(state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("routes TRIAGED -> reproduce", () => {
    expect(route(initialState(event))).toBe("reproduce");
  });

  it("routes REPRODUCED -> diagnose", () => {
    const state: SwarmState = { ...initialState(event), phase: "REPRODUCED" };
    expect(route(state)).toBe("diagnose");
  });

  it("routes DIAGNOSED -> sandbox", () => {
    const state: SwarmState = { ...initialState(event), phase: "DIAGNOSED" };
    expect(route(state)).toBe("sandbox");
  });

  it("a passing sandbox run routes to verify", () => {
    const state: SwarmState = {
      ...initialState(event),
      phase: "SANDBOXED",
      sandboxResult: { exitCode: 0, logs: "", diff: "diff", assertionPassed: true },
    };
    expect(route(state)).toBe("verify");
  });

  it("a failing sandbox run under the retry ceiling routes back to diagnose", () => {
    const state: SwarmState = {
      ...initialState(event),
      phase: "SANDBOXED",
      retryCount: 1,
      maxRetries: 3,
      sandboxResult: { exitCode: 1, logs: "boom", diff: null, assertionPassed: false },
    };
    expect(route(state)).toBe("retry_diagnose");
  });

  it("a failing sandbox run AT the retry ceiling escalates instead of looping forever", () => {
    const state: SwarmState = {
      ...initialState(event),
      phase: "SANDBOXED",
      retryCount: 3,
      maxRetries: 3,
      sandboxResult: { exitCode: 1, logs: "boom", diff: null, assertionPassed: false },
    };
    expect(route(state)).toBe("escalate");
  });

  it("SANDBOXED with no sandboxResult yet escalates rather than crashing", () => {
    const state: SwarmState = { ...initialState(event), phase: "SANDBOXED" };
    expect(route(state)).toBe("escalate");
  });

  it("routes VERIFIED -> hitl", () => {
    const state: SwarmState = { ...initialState(event), phase: "VERIFIED" };
    expect(route(state)).toBe("hitl");
  });
});
