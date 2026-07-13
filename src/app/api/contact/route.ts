import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema, isHoneypotTripped } from "@/lib/contact-schema";
import { site } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot tripped — silently accept without sending so bots get no signal.
  if (isHoneypotTripped(body)) {
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO ?? site.email;
  const from = process.env.CONTACT_FROM ?? "Mike's Nursery <onboarding@resend.dev>";

  // Not wired up yet (e.g. gift build before Mike's domain is verified):
  // log the message so nothing is lost, and let the visitor see success.
  if (!apiKey) {
    console.info("[contact] RESEND_API_KEY not set — logging submission instead of emailing:", {
      to,
      ...data,
    });
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `New inquiry (${data.topic}) — ${data.name}`,
      text: [
        `Name:  ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || "—"}`,
        `Topic: ${data.topic}`,
        "",
        data.message,
      ].join("\n"),
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json(
        { ok: false, error: "We couldn't send that just now. Please call us instead." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please call us instead." },
      { status: 500 },
    );
  }
}
