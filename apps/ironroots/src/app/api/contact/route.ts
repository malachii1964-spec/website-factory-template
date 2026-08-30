import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/email";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill in your name, email, and a message." },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        error: "The contact form isn't connected yet. Add RESEND_API_KEY to enable it.",
        code: "email_not_configured",
      },
      { status: 503 },
    );
  }

  const { ok } = await sendContactMessage(parsed.data);
  if (!ok) {
    return NextResponse.json(
      { error: "We couldn't send your message. Please try again in a moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
