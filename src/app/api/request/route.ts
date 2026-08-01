import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requestSchema } from "@/lib/request-schema";
import { site } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const v = parsed.data;

  // Honeypot filled → silently accept and drop (don't tip off bots).
  if (v.company) return NextResponse.json({ ok: true });

  const key = process.env.RESEND_API_KEY;
  const inbox = process.env.REQUEST_INBOX_EMAIL;
  // Not wired up yet → tell the client so it can show the call/text fallback.
  if (!key || !inbox) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const from =
    process.env.RESEND_FROM ||
    "Chautauqua County Courier <dispatch@chautauquacountycourier.com>";

  const rows: [string, string][] = [
    ["Name", v.name],
    ["Phone", v.phone],
    ["Request", v.requestType],
    ["When", v.timing],
    ["Pickup", v.pickup || "—"],
    ["Dropoff", v.dropoff || "—"],
    ["Details", v.details],
  ];
  const text = rows.map(([k, val]) => `${k}: ${val}`).join("\n");
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#23162a">
<h2 style="margin:0 0 4px;font-size:18px">New run request</h2>
<p style="margin:0 0 16px;color:#6d5f6f;font-size:13px">via chautauquacountycourier.com</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
${rows
  .map(
    ([k, val]) =>
      `<tr><td style="padding:6px 16px 6px 0;color:#6d5f6f;font-size:13px;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;color:#23162a">${escapeHtml(val)}</td></tr>`,
  )
  .join("")}
</table></div>`;

  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from,
      to: inbox,
      subject: `New run request — ${v.requestType} (${v.timing})`,
      text,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Never claim success we didn't achieve — the client shows the phone fallback.
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
}

// Belt-and-suspenders: also expose the live number in case the UI wants it.
export function GET() {
  return NextResponse.json({ phone: site.phoneDigits });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
