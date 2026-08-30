import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck, Sprout, CalendarCheck } from "lucide-react";
import {
  products,
  categories,
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/products";
import { ProductIcon } from "@/lib/icons";
import { ProductCard } from "@/components/product-card";
import { AddToCartPanel } from "@/components/add-to-cart-panel";
import { HarvestWheel } from "@/components/harvest-wheel";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: `${product.title} · Lake Erie IronRoots`,
      description: product.description,
    },
  };
}

const TRUST = [
  { icon: Sprout, text: "Grown on our farm — never a broker or reseller" },
  { icon: CalendarCheck, text: "Cut or pulled within a day of pickup" },
  { icon: Truck, text: "Local pickup and delivery across the county" },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const categoryMeta = categories.find((c) => c.id === product.category);
  const related = getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  return (
    <>
      <div className="border-b border-border">
        <div className="container-page py-16 lg:py-20">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-lake"
          >
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-leaf-tint text-leaf">
                  <ProductIcon name={product.icon} className="h-6 w-6" />
                </span>
                {categoryMeta && (
                  <Link
                    href={`/shop?category=${product.category}`}
                    className="eyebrow hover:text-lake"
                  >
                    {categoryMeta.label}
                  </Link>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                {product.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {product.longDescription}
              </p>

              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Grow method</dt>
                  <dd className="font-medium text-foreground">{product.growMethod}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sold</dt>
                  <dd className="font-medium text-foreground">{product.unit}</dd>
                </div>
              </dl>

              <div className="mt-10">
                <h2 className="eyebrow">When it&rsquo;s in season</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.inSeasonMonths.length === 12
                    ? "Grown hydroponically or in storage year-round — available every month."
                    : "Field-grown or storage-limited — available in the highlighted months."}
                </p>
                <div className="mt-4">
                  <HarvestWheel activeMonths={product.inSeasonMonths} />
                </div>
              </div>
            </div>

            <div className="lg:pl-4">
              <div className="panel sticky top-24 p-6">
                {product.tag && (
                  <span className="inline-block rounded-full border border-harvest/30 bg-harvest-tint px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-harvest">
                    {product.tag}
                  </span>
                )}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-foreground">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">{product.unit}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pay online, pick up at the farm stand or choose local delivery.
                </p>

                <div className="mt-6">
                  <AddToCartPanel slug={product.slug} />
                </div>

                <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                  {TRUST.map((t) => {
                    const Icon = t.icon;
                    return (
                      <li key={t.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-leaf" />
                        {t.text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="py-16">
          <div className="container-page">
            <h2 className="font-display text-xl font-medium tracking-tight">
              More {categoryMeta?.label}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
