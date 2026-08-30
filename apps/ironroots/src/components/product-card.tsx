"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { ProductIcon } from "@/lib/icons";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { add } = useCart();

  return (
    <div
      className={cn(
        "panel lift group flex flex-col p-5 transition-colors hover:border-lake",
        className,
      )}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="flex flex-1 flex-col rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-harvest"
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-leaf-tint text-leaf">
            <ProductIcon name={product.icon} className="h-5 w-5" />
          </span>
          {product.tag && (
            <span className="rounded-full border border-harvest/30 bg-harvest-tint px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-harvest">
              {product.tag}
            </span>
          )}
        </div>

        <h3 className="font-display text-[1.05rem] font-medium leading-snug text-foreground">
          {product.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </Link>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-muted-foreground">{product.unit}</span>
        </div>
        <button
          type="button"
          onClick={() => add(product.slug)}
          className="inline-flex items-center gap-1 rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-harvest hover:text-harvest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-harvest"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
