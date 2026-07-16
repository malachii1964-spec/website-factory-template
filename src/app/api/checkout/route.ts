import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getChargeable } from "@/lib/pricing";

const bodySchema = z.object({
  productId: z.string().min(1).max(128),
  email: z.string().email().optional(),
});

function siteOrigin(req: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get("origin") ||
    new URL(req.url).origin
  );
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    // Not an error the buyer caused — tell the operator exactly what's missing.
    return NextResponse.json(
      {
        error:
          "Checkout isn't connected yet. Add STRIPE_SECRET_KEY to your environment to accept payments.",
        code: "stripe_not_configured",
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product selection." },
      { status: 400 },
    );
  }

  const item = getChargeable(parsed.data.productId);
  if (!item) {
    return NextResponse.json(
      { error: `We couldn't find that product.` },
      { status: 404 },
    );
  }

  const stripe = new Stripe(secret);
  const origin = siteOrigin(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: item.mode,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: item.amountCents,
            product_data: {
              name: item.name,
              ...(item.description && { description: item.description }),
            },
            ...(item.mode === "subscription" &&
              item.interval && { recurring: { interval: item.interval } }),
          },
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: { product_id: item.id },
      ...(parsed.data.email && { customer_email: parsed.data.email }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again in a moment." },
      { status: 500 },
    );
  }
}
