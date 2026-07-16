import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getChargeable } from "@/lib/pricing";
import { buildDownloadUrl } from "@/lib/downloads";
import { sendPurchaseEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");

  if (!secret || !webhookSecret || !sig) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 400 },
    );
  }

  const raw = await req.text();
  const stripe = new Stripe(secret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Signature verification failed." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.product_id;
    const email = session.customer_details?.email ?? session.customer_email ?? undefined;
    const item = productId ? getChargeable(productId) : null;

    // Only one-time products get an emailed download; subscriptions are access-based.
    if (email && item && item.mode === "payment") {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.futuredeskai.com";
      const downloadUrl = buildDownloadUrl(origin, item.id);
      await sendPurchaseEmail({ to: email, productName: item.name, downloadUrl });
    }
  }

  // Always 200 quickly so Stripe doesn't retry a handled event.
  return NextResponse.json({ received: true });
}
