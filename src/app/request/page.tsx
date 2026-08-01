import type { Metadata } from "next";
import { Phone, Check } from "lucide-react";
import { RequestForm } from "@/components/ccc/request-form";
import { site, formatPhone, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Run",
  description:
    "Tell Chautauqua County Courier what you need picked up, delivered, or handled. We reply with one guaranteed price before we go.",
};

const phone = formatPhone(site.phoneDigits);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RequestPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const initial = {
    requestType: one(sp.type),
    pickup: one(sp.pickup),
    dropoff: one(sp.dropoff),
    details: one(sp.details),
  };
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
        <div>
          <p className="eyebrow eyebrow-grape">Request a run</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Tell us the run. We&rsquo;ll handle the rest.</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Fill this out and the dispatcher gets it straight away — then calls or
            texts you back with one guaranteed price before we go. No account, no
            app, no charge to ask.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "One local person handles your run start to finish.",
              "One price, agreed before we move — no meter, no surprise.",
              "Almost anything legal, safe, and vehicle-friendly.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-accent-tint text-accent">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>

          <div className="ticket mt-8 p-5">
            <p className="readout text-xs text-muted-foreground">Rather just call?</p>
            <a
              href={telHref(site.phoneDigits)}
              className="mt-1 flex items-center gap-2 font-display text-2xl font-bold hover:text-accent"
            >
              <Phone className="h-5 w-5 text-accent" />
              {phone}
            </a>
          </div>
        </div>

        <RequestForm initial={initial} />
      </div>
    </section>
  );
}
