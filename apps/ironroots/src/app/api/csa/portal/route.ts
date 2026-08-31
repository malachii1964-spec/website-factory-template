import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { csaSubscription } from "@/lib/schema";

const bodySchema = z.object({
  stripeSubscriptionId: z.string().min(1).max(255),
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
        error: "Billing isn't connected yet. Add STRIPE_SECRET_KEY to enable self-serve management.",
        code: "stripe_not_configured",
      },
      { status: 503 },
    );
  }
  if (!auth || !db) {
    return NextResponse.json(
      {
        error: "Accounts aren't connected yet. Add DATABASE_URL to enable this.",
        code: "auth_not_configured",
      },
      { status: 503 },
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Please sign in first.", code: "unauthenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  // Ownership check — a signed-in customer may only open the portal for
  // their own subscription, never one they guessed the Stripe id of.
  const [owned] = await db
    .select()
    .from(csaSubscription)
    .where(
      and(
        eq(csaSubscription.stripeSubscriptionId, parsed.data.stripeSubscriptionId),
        eq(csaSubscription.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!owned) {
    return NextResponse.json({ error: "We couldn't find that subscription." }, { status: 404 });
  }

  const stripe = new Stripe(secret);

  try {
    const subscription = await stripe.subscriptions.retrieve(owned.stripeSubscriptionId);
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteOrigin(req)}/account/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[csa portal] Stripe error:", err);
    return NextResponse.json(
      { error: "We couldn't open billing management. Please try again in a moment." },
      { status: 500 },
    );
  }
}
