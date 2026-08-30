"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBasket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

export function AddToCartPanel({ slug }: { slug: string }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    add(slug, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-md border border-border-strong">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-11 w-11 place-items-center text-foreground hover:text-harvest"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-11 w-11 place-items-center text-foreground hover:text-harvest"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={cn(buttonVariants({ size: "lg" }), "flex-1")}
        >
          <ShoppingBasket className="h-5 w-5" />
          {justAdded ? "Added to cart" : "Add to cart"}
        </button>
      </div>
      {justAdded && (
        <Link href="/cart" className="text-sm font-medium text-lake underline underline-offset-4">
          View cart & checkout →
        </Link>
      )}
    </div>
  );
}
