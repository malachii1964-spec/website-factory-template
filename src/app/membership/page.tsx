import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { membershipPlans } from "@/lib/pricing";
import { BuyButton } from "@/components/buy-button";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inner Circle membership",
  description:
    "Join the FutureDeskAI Inner Circle — every product, new drops monthly, priority support, and a private community. Cancel anytime.",
};

const PERKS = [
  "Access to every current product — instantly",
  "New prompt packs & templates added every month",
  "Priority, human support (real replies, fast)",
  "Members-only community of operators & builders",
  "Early access to new products before launch",
  "Cancel anytime — no lock-in, no games",
];

export default function MembershipPage() {
  const monthly = membershipPlans.find((p) => p.id === "inner-circle-monthly");
  const annual = membershipPlans.find((p) => p.id === "inner-circle-annual");

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute left-1/2 top-[-20%] h-[340px] w-[720px] -translate-x-1/2 rounded-full opacity-20 blur-[130px]"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--accent) 50%, transparent), transparent 70%)" }}
          aria-hidden
        />
        <div className="container-page relative py-16 text-center lg:py-24">
          <p className="eyebrow inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> The Inner Circle
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[3rem]">
            Everything we make. Every month. One membership.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Stop buying tools one at a time. Get the entire library plus every
            new drop, priority support, and a room full of people building the
            same way you are.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel p-8">
            <h2 className="text-xl font-semibold tracking-tight">What you get</h2>
            <ul className="mt-6 grid gap-3.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-tint text-accent">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-foreground">{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            {annual && (
              <div className="panel ticks relative p-6">
                <span className="readout absolute right-5 top-5 rounded-full border border-accent/30 bg-accent-tint px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-accent">
                  Best value
                </span>
                <p className="text-sm font-medium text-muted-foreground">Annual</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="readout text-4xl font-semibold text-foreground">
                    {formatPrice(annual.amountCents / 100)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ year</span>
                </div>
                <p className="mt-1 text-sm text-active">Save 14% vs monthly</p>
                <BuyButton productId={annual.id} label="Join annual" className="mt-5" size="md" />
              </div>
            )}
            {monthly && (
              <div className="panel p-6">
                <p className="text-sm font-medium text-muted-foreground">Monthly</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="readout text-4xl font-semibold text-foreground">
                    {formatPrice(monthly.amountCents / 100)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Cancel anytime</p>
                <BuyButton productId={monthly.id} label="Join monthly" className="mt-5" size="md" />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
