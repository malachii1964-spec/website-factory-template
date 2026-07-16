import type { Metadata } from "next";
import Link from "next/link";
import { products, categories, type ProductCategory } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All products",
  description:
    "Browse every FutureDeskAI tool — prompt libraries, templates, e-books, industry automation kits, asset packs, and courses. Buy once, download instantly.",
};

const CATEGORY_IDS = categories.map((c) => c.id);

function isCategory(value: string | undefined): value is ProductCategory {
  return !!value && (CATEGORY_IDS as string[]).includes(value);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = isCategory(category) ? category : null;
  const activeMeta = active ? categories.find((c) => c.id === active) : null;
  const list = active
    ? products.filter((p) => p.category === active)
    : products;

  return (
    <>
      <section className="border-b border-border">
        <div className="grid-blueprint absolute inset-x-0 h-64 opacity-30" aria-hidden />
        <div className="container-page relative py-14 lg:py-16">
          <p className="eyebrow">The catalog</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {activeMeta ? activeMeta.label : "Every tool in the arsenal"}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            {activeMeta
              ? activeMeta.description
              : "Thirty battle-tested tools across six categories. Each one solves a specific problem — pick what you need, download it instantly, and put it to work today."}
          </p>

          {/* Category filter */}
          <div className="mt-8 flex flex-wrap gap-2">
            <FilterChip href="/products" active={!active} label="All" count={products.length} />
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                href={`/products?category=${c.id}`}
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
          <p className="readout mb-6 text-xs text-muted-foreground">
            {list.length} {list.length === 1 ? "product" : "products"}
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
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-accent hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("readout text-[0.68rem]", active ? "text-accent-foreground/80" : "text-muted-foreground")}>
        {count}
      </span>
    </Link>
  );
}
