import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout canceled",
  robots: { index: false },
};

export default function CheckoutCancelPage() {
  return (
    <section className="py-24">
      <div className="container-page max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-border bg-surface-2 text-muted-foreground">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          No charge was made.
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          You closed checkout before finishing — nothing was billed. Your cart
          is right where you left it whenever you&rsquo;re ready.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/products" className={buttonVariants()}>
            Back to products
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Return home
          </Link>
        </div>
      </div>
    </section>
  );
}
