import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { sendWelcomeEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error: "The free toolkit isn't connected yet. Add RESEND_API_KEY to enable email capture.",
        code: "email_not_configured",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  // Add to the audience (best-effort — don't fail the signup if this errors).
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    try {
      const resend = new Resend(key);
      await resend.contacts.create({ email, audienceId, unsubscribed: false });
    } catch {
      /* already subscribed or transient — continue to the welcome email */
    }
  }

  const sent = await sendWelcomeEmail(email);
  if (!sent.ok) {
    return NextResponse.json(
      { error: "We couldn't send the email just now. Please try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
