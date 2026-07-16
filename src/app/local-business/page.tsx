import type { Metadata } from "next";
import Link from "next/link";
import { Clock, TrendingUp, PhoneOff } from "lucide-react";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Local business AI kits",
  description:
    "Industry-specific AI automation kits for HVAC, plumbing, dental, real estate, restaurants, salons, contractors and more. Save 15+ hours a week on admin.",
};

const OUTCOMES = [
  { icon: PhoneOff, stat: "Every lead", label: "captured — even the calls you miss on the job" },
  { icon: Clock, stat: "15+ hrs", label: "of admin bought back every week" },
  { icon: TrendingUp, stat: "More jobs", label: "booked with automatic follow-ups & reviews" },
];

export default function LocalBusinessPage() {
  const kits = getProductsByCategory("automation");
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-blueprint absolute inset-0 opacity-30" aria-hidden />
        <div className="container-page relative py-16 lg:py-24">
          <p className="eyebrow">For local & service businesses</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[3rem]">
            Your trade already works hard enough. Let AI handle the paperwork.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Done-for-you automation kits built for one industry at a time — no
            tech skills, no monthly software bloat. Set it up in an afternoon and
            buy back your evenings.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#kits" className={buttonVariants({ size: "lg" })}>
              Find my industry kit
            </a>
            <Link href="/products?category=ebooks" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Read the AI playbook
            </Link>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {OUTCOMES.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.label} className="panel p-5">
                  <Icon className="h-6 w-6 text-accent" strokeWidth={1.6} />
                  <p className="readout mt-4 text-2xl font-semibold text-foreground">{o.stat}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="kits" className="py-16 lg:py-20">
        <div className="container-page">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Pick your industry
          </h2>
          <p className="mt-2 text-muted-foreground">
            {kits.length} industry kits — each tuned to the exact jobs, scripts,
            and follow-ups your business runs on.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kits.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
