import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Email capture, and nothing else.
 *
 * Two backends on purpose. In production the list goes to a Resend audience —
 * chosen because storing contacts there needs an API key and no verified
 * domain, which matters while there is no domain to verify. Locally it appends
 * to a file so the form can be developed and tested with no key at all.
 *
 * What it will NOT do is claim success when the address went nowhere. A
 * serverless filesystem is ephemeral, so the local-file path in production
 * would accept every signup and lose every one of them silently — the exact
 * failure that makes a launch metric meaningless. If no store is configured in
 * production, this route says so loudly instead.
 *
 * Uses fetch rather than the Resend SDK deliberately: it is one HTTP call, and
 * a dependency that cannot be installed in the build sandbox is a dependency
 * whose code ships unverified.
 */

const MAX_BODY = 2_000;
// Deliberately permissive: an over-strict pattern rejects real addresses, and
// the cost of a bad row is nil.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LOCAL_STORE =
  process.env.SUBSCRIBER_FILE ?? path.join(process.cwd(), ".data", "subscribers.csv");

type StoreResult = { ok: true } | { ok: false; status: number; error: string };

async function storeInResend(email: string, key: string, audience: string): Promise<StoreResult> {
  let response: Response;
  try {
    response = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
  } catch {
    return { ok: false, status: 502, error: "We could not reach the list. Try again shortly." };
  }

  // Already subscribed is a success from the visitor's point of view — they
  // asked to be told, and they will be.
  if (response.ok || response.status === 409) return { ok: true };

  console.error(`resend contact create failed: ${response.status} ${await response.text()}`);
  return { ok: false, status: 502, error: "We could not save that. Try again shortly." };
}

async function storeLocally(email: string): Promise<StoreResult> {
  try {
    await mkdir(path.dirname(LOCAL_STORE), { recursive: true });
    // Quoted so a comma in an address cannot shift the columns.
    await appendFile(
      LOCAL_STORE,
      `"${email.replaceAll('"', '""')}",${new Date().toISOString()}\n`,
      "utf8",
    );
    return { ok: true };
  } catch {
    return { ok: false, status: 500, error: "We could not save that. Try again shortly." };
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json({ ok: false, error: "That request was too large." }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read that request." }, { status: 400 });
  }

  const email =
    typeof payload === "object" && payload !== null && "email" in payload
      ? String((payload as { email: unknown }).email).trim().toLowerCase()
      : "";

  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That does not look like an email address." },
      { status: 400 },
    );
  }

  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;

  let result: StoreResult;
  if (key && audience) {
    result = await storeInResend(email, key, audience);
  } else if (process.env.NODE_ENV === "production") {
    console.error("RESEND_API_KEY / RESEND_AUDIENCE_ID are unset — refusing to drop a signup.");
    result = {
      ok: false,
      status: 503,
      error: "Signups are not switched on yet. Try again a little later.",
    };
  } else {
    result = await storeLocally(email);
  }

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
