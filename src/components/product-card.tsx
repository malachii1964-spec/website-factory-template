import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { ProductIcon } from "@/lib/icons";
import { formatPrice, cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "panel ticks lift group flex flex-col p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface-2 text-accent">
          <ProductIcon name={product.icon} className="h-5 w-5" />
        </span>
        {product.tag && (
          <span className="readout rounded-full border border-accent/30 bg-accent-tint px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-accent">
            {product.tag}
          </span>
        )}
      </div>

      <h3 className="text-[1.02rem] font-semibold leading-snug tracking-tight text-foreground">
        {product.title}
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {product.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-baseline gap-2">
          <span className="readout text-lg font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="readout text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          {discount && (
            <span className="readout text-[0.62rem] font-semibold text-active">
              −{discount}%
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-accent">
          View
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
