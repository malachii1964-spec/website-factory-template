import type { Metadata } from "next";
import { CalendarClock, PauseCircle, Sprout, Truck } from "lucide-react";
import { CSA_PLANS } from "@/lib/pricing";
import { CsaSubscribeButton } from "@/components/csa-subscribe-button";
import { HarvestWheel } from "@/components/harvest-wheel";

export const metadata: Metadata = {
  title: "Harvest Box CSA",
  description:
    "A weekly, hand-packed box of whatever's actually in season on our Lake Erie farm this week. Pause or cancel anytime.",
};

const HOW_IT_WORKS = [
  {
    icon: Sprout,
    title: "We pack Thursday night",
    body: "Whatever came off the greenhouse and field beds that week — never a fixed list.",
  },
  {
    icon: Truck,
    title: "You pick up or we deliver",
    body: "Farm stand pickup or local delivery across the county, every week on the same schedule.",
  },
  {
    icon: PauseCircle,
    title: "Pause or cancel anytime",
    body: "Going out of town? Pause a week. Done for the season? Cancel — no contract.",
  },
];

export default function CsaPage() {
  return (
    <>
      <section className="furrow-ground border-b border-border">
        <div className="container-page py-16 lg:py-20">
          <p className="eyebrow">Harvest Box CSA</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            The freshest box on your table, every single week — all year.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Skip the reordering. Subscribe once and we hand-pack a box from
            whatever&rsquo;s actually at peak on the farm this week — hydroponic
            greens keep it going even in a Lake Erie January.
          </p>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="container-page">
          <p className="eyebrow">How it works</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="panel p-5">
                  <Icon className="h-5 w-5 text-leaf" />
                  <h3 className="mt-3 font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="container-page">
          <p className="eyebrow">Plans</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {CSA_PLANS.map((plan) => (
              <div key={plan.id} className="panel p-6">
                <h2 className="font-display text-xl font-medium text-foreground">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-foreground">
                    ${(plan.amountCents / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {plan.interval}</span>
                </div>
                <div className="mt-5">
                  <CsaSubscribeButton planId={plan.id} label={`Subscribe — $${(plan.amountCents / 100).toFixed(0)}/${plan.interval}`} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            You&rsquo;ll need an account so you can manage your subscription later.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page max-w-2xl">
          <p className="eyebrow">Why year-round is possible here</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">
            The Harvest Wheel — what&rsquo;s actually growing, every month
          </h2>
          <p className="mt-3 text-muted-foreground">
            Most Lake Erie farms go quiet from November to April. Ours doesn&rsquo;t —
            hydroponic greens and herbs run in the greenhouse straight through
            winter, so a Harvest Box never shows up empty.
          </p>
          <div className="mt-6">
            <HarvestWheel activeMonths={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} />
          </div>
        </div>
      </section>
    </>
  );
}
