import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, Mail } from "lucide-react";
import Stripe from "stripe";
import { buttonVariants } from "@/components/ui/button";

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
      <div className="container-page max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-active/30 bg-active-tint text-active">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          You&rsquo;re all set.
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Payment confirmed{session?.email ? <> — a receipt is on its way to <span className="text-foreground">{session.email}</span></> : null}. Your
          download link and access details are being delivered to your inbox now.
        </p>

        <div className="panel mt-8 space-y-4 p-6 text-left">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-medium text-foreground">Check your email</p>
              <p className="text-sm text-muted-foreground">
                Your files and instructions arrive within a couple of minutes.
                Check spam if you don&rsquo;t see it.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-medium text-foreground">Instant, lifetime access</p>
              <p className="text-sm text-muted-foreground">
                Your purchase is yours forever, including free future updates.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/products" className={buttonVariants()}>
            Keep browsing
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
