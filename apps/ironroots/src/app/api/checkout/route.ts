import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getProductBySlug } from "@/lib/products";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(128),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  email: z.string().email().optional(),
  // Optional Community Harvest Fund round-up, clamped server-side.
  donationCents: z.number().int().min(0).max(100_00).optional(),
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
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const { slug, qty } of parsed.data.items) {
    const product = getProductBySlug(slug);
    if (!product) {
      return NextResponse.json(
        { error: `"${slug}" is no longer available. Please refresh your cart.` },
        { status: 404 },
      );
    }
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: `${product.title} (${product.unit})`,
        },
      },
    });
  }

  if (parsed.data.donationCents && parsed.data.donationCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: parsed.data.donationCents,
        product_data: {
          name: "Community Harvest Fund donation",
          description: "Helps subsidize a Community Share for another family.",
        },
      },
    });
  }

  const stripe = new Stripe(secret);
  const origin = siteOrigin(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        order_items: JSON.stringify(
          parsed.data.items.map((i) => `${i.slug}x${i.qty}`),
        ),
        ...(parsed.data.donationCents && {
          donation_cents: String(parsed.data.donationCents),
        }),
      },
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
