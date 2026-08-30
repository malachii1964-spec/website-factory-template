import type { Metadata } from "next";
import Link from "next/link";
import { products, categories, type ProductCategory } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Hydroponic greens, field-grown roots, tomatoes, herbs, and weekly Harvest Boxes — grown on the Lake Erie shoreline, sold by the item.",
};

const CATEGORY_IDS = categories.map((c) => c.id);

function isCategory(value: string | undefined): value is ProductCategory {
  return !!value && (CATEGORY_IDS as string[]).includes(value);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = isCategory(category) ? category : null;
  const activeMeta = active ? categories.find((c) => c.id === active) : null;
  const list = active ? products.filter((p) => p.category === active) : products;

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14 lg:py-16">
          <p className="eyebrow">The shop</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
            {activeMeta ? activeMeta.label : "This week's harvest"}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            {activeMeta
              ? activeMeta.description
              : "Everything we're currently harvesting, sold by the item. Hydroponic crops run year-round; field crops follow the actual Lake Erie growing season — check the Harvest Wheel on each product."}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <FilterChip href="/shop" active={!active} label="All" count={products.length} />
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                href={`/shop?category=${c.id}`}
                active={active === c.id}
                label={c.label}
                count={products.filter((p) => p.category === c.id).length}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-page">
          <p className="mb-6 text-xs text-muted-foreground">
            {list.length} {list.length === 1 ? "item" : "items"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-lake bg-lake text-lake-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-lake hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("text-[0.68rem]", active ? "text-lake-foreground/80" : "text-muted-foreground")}>
        {count}
      </span>
    </Link>
  );
}
