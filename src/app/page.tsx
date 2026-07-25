import { Phone, MessageSquare, Check, MapPin, Clock } from "lucide-react";
import { CountyMap } from "@/components/ccc/county-map";
import { buttonVariants } from "@/components/ui/button";
import { serviceGroups } from "@/lib/services";
import { site, coverage, formatPhone, telHref, smsHref } from "@/lib/site";

const phone = formatPhone(site.phoneDigits);

export default function Home() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden contour">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="fade-up">
            <p className="eyebrow flex items-center gap-2">
              <span className="status-dot" aria-hidden />
              Chautauqua County · On call
            </p>
            <h1 className="mt-5 text-[2.7rem] leading-[1.02] sm:text-6xl">
              One call.
              <br />
              <span className="text-grape">Consider it done.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Delivery, errands, and concierge runs across the whole county — one
              local dispatcher who knows the back roads, and one price agreed
              before we go. The help Pip&rsquo;s used to give, back and better.
            </p>

            {/* The dispatch ticket — the primary call to action */}
            <div className="ticket ticket--perf mt-8 max-w-md p-5 pt-7">
              <p className="readout text-xs text-muted-foreground">
                Call or text the dispatcher
              </p>
              <a
                href={telHref(site.phoneDigits)}
                className="mt-1 flex items-center gap-2 font-display text-3xl font-bold tracking-tight hover:text-accent sm:text-4xl"
              >
                <Phone className="h-6 w-6 text-accent" />
                {phone}
              </a>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a href={telHref(site.phoneDigits)} className={buttonVariants({ size: "md" })}>
                  <Phone className="h-4 w-4" /> Call now
                </a>
                <a href={smsHref(site.phoneDigits)} className={buttonVariants({ variant: "outline", size: "md" })}>
                  <MessageSquare className="h-4 w-4" /> Text your errand
                </a>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-lake" /> You approve the price before we go.
              </p>
            </div>
          </div>

          {/* The signature — the county route map */}
          <div className="relative">
            <div className="ticket p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="eyebrow eyebrow-grape">Today&rsquo;s route</p>
                <p className="readout text-xs text-muted-foreground">Westfield → Jamestown</p>
              </div>
              <CountyMap />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="border-y border-border bg-surface">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { t: "A local person, not an app", d: "The same dispatcher every time — who knows the county and owns your job." },
            { t: "One price, before we go", d: "Dispatch minimum, mileage, and time — quoted and agreed up front. No meter." },
            { t: "Almost anything legal", d: "Multi-stop runs, wait-and-return, weekly routes, lake-house stocking, business delivery." },
          ].map((item) => (
            <div key={item.t} className="flex gap-3">
              <span className="mt-1 grid h-6 w-6 flex-none place-items-center rounded-full bg-accent-tint text-accent">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="font-semibold">{item.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="container-page scroll-mt-20 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow eyebrow-grape">What we run for you</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Eight kinds of runs. One number to call.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            If it takes a drive, we probably handle it. Tell us what you need — if
            it&rsquo;s legal and safe, consider it done.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {serviceGroups.map((group) => (
            <div key={group.key}>
              <div className="flex items-baseline gap-3">
                <h3 className="font-display text-2xl font-bold">{group.label}</h3>
                <span className="readout text-xs text-muted-foreground">{group.note}</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((s) => (
                  <div key={s.id} className="ticket lift p-5">
                    <p className="font-display text-lg font-bold text-grape">{s.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
                    <p className="readout mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                      e.g. {s.eg}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="border-y border-border bg-surface scroll-mt-20">
        <div className="container-page py-20">
          <p className="eyebrow eyebrow-grape">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">Three steps. No app to download.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Call or text", d: "Tell the dispatcher what you need — a pickup, a delivery, a list of stops, or a standing weekly run." },
              { n: "02", t: "We quote one price", d: "You get one price for the whole job, agreed before we move. No meter, no surge, no surprise on the receipt." },
              { n: "03", t: "Consider it done", d: "We run it, keep you posted, and hand you every receipt. Same name, same number, next time." },
            ].map((step) => (
              <div key={step.n} className="ticket p-6">
                <p className="readout text-2xl font-semibold text-accent">{step.n}</p>
                <p className="mt-3 font-display text-xl font-bold">{step.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Coverage ---------- */}
      <section id="coverage" className="container-page scroll-mt-20 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow eyebrow-grape">Coverage</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">The whole county, one call.</h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Based in {site.base}, running all 1,060 square miles of Chautauqua
              County — lakeshore to back roads, town to town.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {coverage.map((town) => (
                <li key={town} className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 flex-none text-grape" />
                  {town}
                </li>
              ))}
            </ul>
            <p className="readout mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {site.hours.map((h) => `${h.days} ${h.time}`).join("  ·  ")}
            </p>
          </div>
          <div className="ticket p-4 sm:p-6">
            <CountyMap />
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="border-y border-border bg-surface scroll-mt-20">
        <div className="container-page py-20">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-grape">Pricing</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">One honest price, agreed before we go.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No hidden fees, no meter running, no surge. We build one price from
              four plain parts and tell you the number before we lift a finger.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {["Dispatch minimum", "Route mileage", "Service time", "Extra stops"].map((part, i) => (
              <div key={part} className="flex items-center gap-3">
                <span className="ticket readout px-4 py-2.5 text-sm">{part}</span>
                {i < 3 && <span className="text-xl text-muted-foreground">+</span>}
              </div>
            ))}
            <span className="text-xl text-muted-foreground">=</span>
            <span className="readout rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
              one price, agreed up front
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href={telHref(site.phoneDigits)} className={buttonVariants({ size: "lg" })}>
              <Phone className="h-4 w-4" /> Get your price — {phone}
            </a>
            <a href={smsHref(site.phoneDigits)} className={buttonVariants({ variant: "outline", size: "lg" })}>
              <MessageSquare className="h-4 w-4" /> Text us the details
            </a>
          </div>
          <p className="readout mt-4 text-xs text-muted-foreground">
            Scheduled &amp; recurring runs cost less than dedicated, drop-everything runs.
          </p>
        </div>
      </section>

      {/* ---------- What we can & can't carry ---------- */}
      <section id="carry" className="container-page scroll-mt-20 py-20">
        <p className="eyebrow eyebrow-grape">Straight talk</p>
        <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">What we can &amp; can&rsquo;t carry.</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Almost anything legal, safe, and vehicle-friendly. A few things the law
          keeps us out of — we&rsquo;d rather tell you plainly than surprise you.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="ticket p-6">
            <p className="eyebrow eyebrow-muted">We carry</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Food, groceries & retail", "Packages, documents & returns", "Flowers, hardware & supplies", "Items for repair (wait-and-return)", "Lake-house & business deliveries"].map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-lake" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="ticket p-6">
            <p className="eyebrow eyebrow-muted">We can&rsquo;t (by law)</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {["Cannabis of any kind", "Buying alcohol or tobacco on your behalf", "Prescriptions — unless your pharmacy authorizes the pickup", "Anything unsafe or that won't fit the vehicle"].map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-border-strong" /> {x}
                </li>
              ))}
            </ul>
            <p className="readout mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
              Final rules confirmed with New York counsel before launch.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="border-t border-border bg-grape-tint">
        <div className="container-page py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl sm:text-5xl">
            Got something that needs a drive?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            One local call and it&rsquo;s handled. Consider it done.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={telHref(site.phoneDigits)} className={buttonVariants({ size: "lg" })}>
              <Phone className="h-4 w-4" /> Call {phone}
            </a>
            <a href={smsHref(site.phoneDigits)} className={buttonVariants({ variant: "outline", size: "lg" })}>
              <MessageSquare className="h-4 w-4" /> Text us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
