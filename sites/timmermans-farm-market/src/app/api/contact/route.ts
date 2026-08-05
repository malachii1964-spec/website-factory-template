import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactSchema } from "@/lib/contact-schema";
import { business } from "@/lib/business";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    // No-op until the owner sets keys — see .env.example. Fail loudly in
    // dev/logs rather than silently pretending the email sent.
    console.warn("Contact form submitted but RESEND_API_KEY / CONTACT_TO_EMAIL are not set.");
    return NextResponse.json(
      { ok: false, error: "The contact form isn't fully set up yet — please call instead." },
      { status: 503 },
    );
  }

  const { name, email, message } = parsed.data;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `${business.name} <onboarding@resend.dev>`,
    to,
    replyTo: email,
    subject: `New message from ${name} via the website`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong sending your message. Please call instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
