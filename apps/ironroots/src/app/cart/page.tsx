"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";

export default function CartPage() {
  const { items, lines, total, setQty, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return (
      <section className="py-24">
        <div className="container-page max-w-lg text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-border bg-surface-2 text-muted-foreground">
            <ShoppingBasket className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-medium tracking-tight">Your cart is empty.</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Nothing picked yet. Browse this week&rsquo;s harvest and add what looks good.
          </p>
          <Link href="/shop" className={cn(buttonVariants(), "mt-8")}>
            Shop the harvest
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container-page max-w-3xl">
        <h1 className="text-3xl font-medium tracking-tight">Your cart</h1>

        <div className="mt-8 divide-y divide-border border-y border-border">
          {lines.map((line) => (
            <div key={line.slug} className="flex items-center gap-4 py-5">
              <div className="flex-1">
                <Link href={`/shop/${line.slug}`} className="font-medium text-foreground hover:text-lake">
                  {line.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(line.price)} {line.unit}
                </p>
              </div>
              <div className="inline-flex items-center rounded-md border border-border-strong">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${line.title}`}
                  onClick={() => setQty(line.slug, line.qty - 1)}
                  className="grid h-9 w-9 place-items-center text-foreground hover:text-harvest"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-semibold tabular-nums">{line.qty}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${line.title}`}
                  onClick={() => setQty(line.slug, line.qty + 1)}
                  className="grid h-9 w-9 place-items-center text-foreground hover:text-harvest"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="w-16 text-right font-semibold text-foreground">
                {formatPrice(line.lineTotal)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${line.title} from cart`}
                onClick={() => remove(line.slug)}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-lg font-medium text-foreground">Subtotal</span>
          <span className="text-2xl font-semibold text-foreground">{formatPrice(total)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tax and delivery calculated at checkout.
        </p>

        <button
          type="button"
          onClick={checkout}
          disabled={loading}
          className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full sm:w-auto")}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting checkout…
            </>
          ) : (
            <>
              Checkout
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Want the same box every week without reordering?{" "}
          <Link href="/csa" className="font-medium text-lake underline underline-offset-4">
            See the Harvest Box CSA
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
