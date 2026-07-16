import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ShieldCheck,
  Lock,
  RefreshCw,
  Clock,
  FileText,
  Terminal,
} from "lucide-react";
import {
  products,
  categories,
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/products";
import { ProductIcon } from "@/lib/icons";
import { ProductCard } from "@/components/product-card";
import { BuyButton } from "@/components/buy-button";
import { formatPrice } from "@/lib/utils";
import {
  categorySpec,
  productSamples,
  productFaqs,
  whyUs,
} from "@/lib/product-extras";

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
      title: `${product.title} · FutureDeskAI`,
      description: product.description,
    },
  };
}

const TRUST = [
  { icon: Download, text: "Instant download after purchase" },
  { icon: Lock, text: "Secure checkout via Stripe" },
  { icon: RefreshCw, text: "Free lifetime updates" },
  { icon: ShieldCheck, text: "One-time payment — yours forever" },
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
  const spec = categorySpec[product.category];
  const samples = productSamples[product.slug] ?? [];
  const related = getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <>
      <div className="border-b border-border">
        <div className="container-page py-16 lg:py-20">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> All products
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left — details */}
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface-2 text-accent">
                  <ProductIcon name={product.icon} className="h-6 w-6" />
                </span>
                {categoryMeta && (
                  <Link
                    href={`/products?category=${product.category}`}
                    className="eyebrow eyebrow-muted hover:text-accent"
                  >
                    {categoryMeta.label}
                  </Link>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {product.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {product.longDescription}
              </p>

              <div className="mt-8">
                <h2 className="eyebrow">What&rsquo;s inside</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {samples.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-accent" />
                    <h2 className="eyebrow">See the goods — real excerpts</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Actual samples pulled straight from the product. This is the
                    quality you get — no guessing.
                  </p>
                  <div className="mt-5 grid gap-4">
                    {samples.map((s) => (
                      <div key={s.title} className="panel overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                          <span className="text-sm font-medium text-foreground">{s.title}</span>
                          <span className="readout text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                            {s.kind === "prompt" ? "prompt" : s.kind === "list" ? "reference" : "excerpt"}
                          </span>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 text-[0.82rem] leading-relaxed text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
{s.body}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — sticky buy panel */}
            <div className="lg:pl-4">
              <div className="panel ticks sticky top-24 p-6">
                {product.tag && (
                  <span className="readout inline-block rounded-full border border-accent/30 bg-accent-tint px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-accent">
                    {product.tag}
                  </span>
                )}
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="readout text-4xl font-semibold text-foreground">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="readout text-lg text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {discount && (
                    <span className="readout rounded bg-active-tint px-1.5 py-0.5 text-xs font-semibold text-active">
                      save {discount}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  One-time payment. Instant access.
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                  <div className="bg-surface p-3">
                    <dt className="readout text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                      Format
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <FileText className="h-3 w-3 text-accent" />
                      {spec.format}
                    </dd>
                  </div>
                  <div className="bg-surface p-3">
                    <dt className="readout text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                      Time back
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Clock className="h-3 w-3 text-accent" />
                      {spec.hoursBack}
                    </dd>
                  </div>
                </dl>

                <BuyButton
                  productId={product.slug}
                  label={`Buy ${formatPrice(product.price)}`}
                  className="mt-6"
                />

                <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                  {TRUST.map((t) => {
                    const Icon = t.icon;
                    return (
                      <li key={t.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-accent" />
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

      {/* Why FutureDeskAI — the differentiator */}
      <section className="border-b border-border bg-surface py-16">
        <div className="container-page">
          <p className="eyebrow">Why FutureDeskAI</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Better than a 100,000-prompt data dump
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {whyUs.map((w) => (
              <div key={w.title} className="panel flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold tracking-tight text-foreground">{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border py-16">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">Questions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Everything you need to know
          </h2>
          <dl className="mt-8 divide-y divide-border border-t border-border">
            {productFaqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-medium text-foreground">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16">
          <div className="container-page">
            <h2 className="text-xl font-semibold tracking-tight">
              More in {categoryMeta?.label}
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
