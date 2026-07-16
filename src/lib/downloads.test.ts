import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.DOWNLOAD_SECRET = "test-secret-key-for-vitest";
});

// Imported after env is set; functions read the secret at call time regardless.
import {
  createDownloadToken,
  verifyDownloadToken,
  downloadFileName,
} from "./downloads";

describe("download tokens", () => {
  it("round-trips a valid token back to its slug", () => {
    const token = createDownloadToken("easy-ai-prompt-mastery");
    expect(verifyDownloadToken(token)).toEqual({ slug: "easy-ai-prompt-mastery" });
  });

  it("rejects a tampered token", () => {
    const token = createDownloadToken("ultimate-chatgpt-prompt-vault");
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    expect(verifyDownloadToken(tampered)).toBeNull();
  });

  it("rejects a token whose slug was swapped", () => {
    const token = createDownloadToken("business-email-prompt-pack");
    const [, sig] = token.split(".");
    const forged = Buffer.from("full-vault:" + (Date.now() + 100000))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(verifyDownloadToken(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createDownloadToken("midjourney-prompt-mastery", -1000);
    expect(verifyDownloadToken(token)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifyDownloadToken("not-a-real-token")).toBeNull();
    expect(verifyDownloadToken("")).toBeNull();
  });

  it("builds a clean human filename", () => {
    expect(downloadFileName("easy-ai-prompt-mastery")).toMatch(/\.pdf$/);
  });
});
