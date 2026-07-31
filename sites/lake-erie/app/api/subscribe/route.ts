import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Email capture, and nothing else.
 *
 * No Resend key exists yet, and a signup route that throws because a key is
 * missing loses the one thing this page is for. So addresses append to a local
 * file until a provider is wired up — a list on disk is worth more than a
 * beautiful integration that is not connected.
 */

const MAX_BODY = 2_000;
// Deliberately permissive: an over-strict pattern rejects real addresses, and
// the cost of a bad row in a text file is nil.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STORE = process.env.SUBSCRIBER_FILE ?? path.join(process.cwd(), ".data", "subscribers.csv");

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

  try {
    await mkdir(path.dirname(STORE), { recursive: true });
    // Quoted so a comma in an address cannot shift the columns.
    await appendFile(STORE, `"${email.replaceAll('"', '""')}",${new Date().toISOString()}\n`, "utf8");
  } catch {
    // The address is lost, so say so rather than showing a success state that
    // did not happen.
    return NextResponse.json(
      { ok: false, error: "We could not save that. Try again shortly." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
