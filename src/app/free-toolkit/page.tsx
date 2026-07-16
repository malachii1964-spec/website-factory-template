import type { Metadata } from "next";
import { Gift, CheckCircle2 } from "lucide-react";
import { LeadForm } from "@/components/lead-form";

export const metadata: Metadata = {
  title: "Free AI starter prompts",
  description:
    "Get a free set of copy-paste AI prompts to save your first few hours this week — no cost, instant delivery.",
};

const INCLUDED = [
  "Copy-paste prompts for follow-ups, quotes & reviews",
  "Written in plain English — works with ChatGPT, Claude & Gemini",
  "Fill in the blanks and send — no learning curve",
  "A taste of the full library, on us",
];

export default function FreeToolkitPage() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      <div className="grid-blueprint absolute inset-0 opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[680px] -translate-x-1/2 rounded-full opacity-20 blur-[130px]"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--accent) 50%, transparent), transparent 70%)" }}
        aria-hidden
      />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="eyebrow inline-flex items-center gap-2">
            <Gift className="h-3.5 w-3.5" /> Free — no card needed
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[3rem]">
            Save your first few hours this week — free.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Drop your email and I&rsquo;ll send you a set of copy-paste AI prompts
            you can use today — the exact kind that recover missed leads, write
            your follow-ups, and ask for reviews. It&rsquo;s a real taste of the
            full library, on the house.
          </p>
          <ul className="mt-7 grid gap-2.5">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel ticks p-6 lg:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Get your free prompts</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Instant delivery to your inbox.
          </p>
          <div className="mt-6">
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
