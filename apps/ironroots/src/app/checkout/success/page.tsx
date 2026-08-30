import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, Truck } from "lucide-react";
import Stripe from "stripe";
import { buttonVariants } from "@/components/ui/button";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

async function loadSession(sessionId?: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !sessionId) return null;
  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      email: session.customer_details?.email ?? session.customer_email ?? null,
      total: session.amount_total,
      currency: session.currency ?? "usd",
    };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const session = await loadSession(session_id);

  return (
    <section className="py-24">
      <ClearCartOnMount />
      <div className="container-page max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-leaf/30 bg-leaf-tint text-leaf">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-medium tracking-tight">
          Order confirmed. Thank you.
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Payment confirmed{session?.email ? <> — a receipt is on its way to <span className="text-foreground">{session.email}</span></> : null}. We&rsquo;re
          picking your order fresh for the next pickup or delivery window.
        </p>

        <div className="panel mt-8 space-y-4 p-6 text-left">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-lake" />
            <div>
              <p className="font-medium text-foreground">Check your email</p>
              <p className="text-sm text-muted-foreground">
                Your receipt and pickup/delivery details arrive within a few minutes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-lake" />
            <div>
              <p className="font-medium text-foreground">Fresh, not stored</p>
              <p className="text-sm text-muted-foreground">
                Everything is harvested to order — expect your produce within
                the next farm pickup cycle.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className={buttonVariants()}>
            Keep shopping
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
