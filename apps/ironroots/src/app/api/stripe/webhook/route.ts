import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { order, csaSubscription } from "@/lib/schema";
import { getProductBySlug } from "@/lib/products";
import { getCsaPlan } from "@/lib/pricing";
import { sendOrderConfirmationEmail, sendCsaWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

/** Metadata written by /api/checkout as `["slug1xqty1","slug2xqty2"]`. */
function parseOrderItems(raw: string | undefined): { slug: string; qty: number }[] {
  if (!raw) return [];
  try {
    const pairs: unknown = JSON.parse(raw);
    if (!Array.isArray(pairs)) return [];
    return pairs
      .filter((p): p is string => typeof p === "string")
      .map((p) => {
        const [slug, qtyStr] = p.split("x");
        const qty = Number(qtyStr);
        return { slug, qty: Number.isFinite(qty) && qty > 0 ? qty : 1 };
      });
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");

  if (!secret || !webhookSecret || !sig) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = new Stripe(secret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email ?? undefined;
    const kind = session.metadata?.kind;

    if (kind === "csa" && session.mode === "subscription") {
      const planId = session.metadata?.plan_id;
      const userId = session.metadata?.user_id;
      const plan = planId ? getCsaPlan(planId) : undefined;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (db && plan && userId && subscriptionId) {
        await db.insert(csaSubscription).values({
          id: randomUUID(),
          userId,
          stripeSubscriptionId: subscriptionId,
          planId: plan.id,
          status: "active",
        });
      }
      if (email && plan) {
        await sendCsaWelcomeEmail({ to: email, planName: plan.name });
      }
    } else if (session.mode === "payment") {
      const items = parseOrderItems(session.metadata?.order_items);
      const resolved = items
        .map(({ slug, qty }) => {
          const product = getProductBySlug(slug);
          return product
            ? { slug, qty, title: product.title, unit: product.unit, priceCents: Math.round(product.price * 100) }
            : null;
        })
        .filter((i): i is NonNullable<typeof i> => i !== null);

      if (db && email) {
        await db.insert(order).values({
          id: randomUUID(),
          userId: null,
          stripeSessionId: session.id,
          email,
          totalCents: session.amount_total ?? 0,
          status: "paid",
          items: resolved.map(({ slug, title, qty, priceCents }) => ({ slug, title, qty, priceCents })),
        });
      }
      if (email && resolved.length > 0) {
        await sendOrderConfirmationEmail({
          to: email,
          items: resolved,
          totalCents: session.amount_total ?? 0,
        });
      }
    }
  }

  // Always 200 quickly so Stripe doesn't retry a handled event.
  return NextResponse.json({ received: true });
}
