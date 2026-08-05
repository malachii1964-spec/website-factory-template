import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function MockResend() {
    return { emails: { send: sendMock } };
  }),
}));

const ORIGINAL_ENV = { ...process.env };

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 400 on invalid input without calling Resend", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_TO_EMAIL = "owner@example.com";
    const { POST } = await import("@/app/api/contact/route");

    const res = await POST(jsonRequest({ name: "", email: "not-an-email", message: "" }));
    const data = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 503 without calling Resend when keys are not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO_EMAIL;
    const { POST } = await import("@/app/api/contact/route");

    const res = await POST(
      jsonRequest({ name: "Jane", email: "jane@example.com", message: "Hello" }),
    );
    const data = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(503);
    expect(data.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 502 when Resend reports an error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_TO_EMAIL = "owner@example.com";
    sendMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { POST } = await import("@/app/api/contact/route");

    const res = await POST(
      jsonRequest({ name: "Jane", email: "jane@example.com", message: "Hello" }),
    );
    const data = (await res.json()) as { ok: boolean; error: string };

    expect(res.status).toBe(502);
    expect(data.ok).toBe(false);
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it("returns 200 and emails the owner on success", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_TO_EMAIL = "owner@example.com";
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    const { POST } = await import("@/app/api/contact/route");

    const res = await POST(
      jsonRequest({ name: "Jane", email: "jane@example.com", message: "Hello" }),
    );
    const data = (await res.json()) as { ok: boolean };

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "owner@example.com", replyTo: "jane@example.com" }),
    );
  });
});
