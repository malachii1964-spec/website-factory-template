import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { clampToPayWhatYouCan, getCsaPlan } from "@/lib/pricing";

const bodySchema = z.object({
  planId: z.string().min(1).max(64),
  // Only honored for the pay-what-you-can Community Share plan; ignored (and
  // clamped server-side either way) for fixed-price plans.
  pledgeCents: z.number().int().min(0).max(1_000_000).optional(),
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
        error: "Checkout isn't connected yet. Add STRIPE_SECRET_KEY to accept payments.",
        code: "stripe_not_configured",
      },
      { status: 503 },
    );
  }
  if (!auth) {
    return NextResponse.json(
      {
        error: "Accounts aren't connected yet. Add DATABASE_URL to enable the CSA.",
        code: "auth_not_configured",
      },
      { status: 503 },
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to subscribe to the Harvest Box.", code: "unauthenticated" },
      { status: 401 },
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
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const plan = getCsaPlan(parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "We couldn't find that plan." }, { status: 404 });
  }

  const amountCents = plan.payWhatYouCan
    ? clampToPayWhatYouCan(plan, parsed.data.pledgeCents ?? plan.amountCents)
    : plan.amountCents;

  const stripe = new Stripe(secret);
  const origin = siteOrigin(req);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            recurring: { interval: plan.interval === "week" ? "week" : "month" },
            product_data: { name: plan.name, description: plan.description },
          },
        },
      ],
      customer_email: session.user.email,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/csa`,
      metadata: { plan_id: plan.id, user_id: session.user.id, kind: "csa" },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[csa checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again in a moment." },
      { status: 500 },
    );
  }
}
