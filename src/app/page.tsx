import Link from "next/link";
import {
  ArrowRight,
  Download,
  ShieldCheck,
  Zap,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  Star,
  BookOpen,
} from "lucide-react";
import { products, categories, getProductBySlug } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { ProductIcon } from "@/lib/icons";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const FEATURED_SLUGS = [
  "ultimate-chatgpt-prompt-vault",
  "ai-workspace-notion-template",
  "passive-income-with-ai-guide",
  "contractor-automation-pack",
  "prompt-engineering-masterclass-ebook",
  "ai-first-professional-course",
];

const TELEMETRY = [
  { value: "30", label: "Ready-to-use tools" },
  { value: "6", label: "Product categories" },
  { value: "$9+", label: "Instant downloads" },
  { value: "24/7", label: "Buy & download" },
];

const PAINS = [
  { icon: Clock, cost: "Hours lost to admin & busywork", fix: "Automation kits that do the repetitive work for you" },
  { icon: CircleDollarSign, cost: "Leaving money on the table", fix: "Proven prompts that write quotes, follow-ups & offers" },
  { icon: Zap, cost: "Staring at a blank AI prompt box", fix: "500+ battle-tested prompts — copy, paste, done" },
  { icon: BookOpen, cost: "Never learned to use AI properly", fix: "Plain-English guides & courses, zero jargon" },
];

const STEPS = [
  { n: "01", title: "Pick your tool", desc: "Browse 30 prompt packs, templates, kits, and courses. Every one solves a specific, real problem." },
  { n: "02", title: "Check out securely", desc: "One-time payment through Stripe. No subscription trap, no upsell maze." },
  { n: "03", title: "Download & use today", desc: "Instant delivery. Open it, plug in your details, and get results the same day." },
];

const TESTIMONIALS = [
  { name: "Mike R.", role: "R&R HVAC Services, Ohio", initials: "MR", text: "I was losing 3–4 leads a week because I couldn't answer calls on jobs. The automation kit paid for itself in the first week — recovered about $2,400 in work I'd have lost." },
  { name: "Sarah T.", role: "Bright Smile Dental, Texas", initials: "ST", text: "The patient recall prompts alone are worth 10x the price. We went from a 40% recall rate to 68% in six weeks just using the reminder templates." },
  { name: "Carlos M.", role: "ProClean Services, Florida", initials: "CM", text: "I'm not a tech person at all. Everything was set up before lunch. My Google reviews went from 12 to 47 in two months using the review prompts." },
];

export default function HomePage() {
  const featured = FEATURED_SLUGS.map(getProductBySlug).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );
  const flagship = getProductBySlug("easy-ai-prompt-mastery");
  const catalogCount = products.length;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-blueprint absolute inset-0 opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-[-20%] h-[380px] w-[760px] -translate-x-1/2 rounded-full opacity-20 blur-[130px]"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%)" }}
          aria-hidden
        />
        <div className="container-page relative grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="fade-up">
            <p className="eyebrow flex items-center gap-2">
              <span className="status-dot status-dot--amber" aria-hidden />
              The AI command center
            </p>
            <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              AI tools that actually{" "}
              <span className="text-accent">do the work</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Battle-tested prompt packs, templates, industry automation kits,
              and courses — built for professionals and local businesses who
              want results, not hype. Buy once, download instantly, get moving
              today.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className={buttonVariants({ size: "lg" })}>
                Browse all products
                <ArrowRight className="h-5 w-5" />
              </Link>
              {flagship && (
                <Link
                  href={`/products/${flagship.slug}`}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Get the EASY AI book — {formatPrice(flagship.price)}
                </Link>
              )}
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Instant digital download", "One-time payment", "No tech skills needed"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-active" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Command deck panel — the signature visual, built in CSS */}
          <div className="fade-up relative" style={{ animationDelay: "120ms" }}>
            <div className="panel overflow-hidden shadow-[0_1px_2px_rgba(20,20,30,0.04),0_24px_60px_-24px_rgba(20,20,40,0.24)]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="readout flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="status-dot" aria-hidden />
                  futuredeskai · command deck
                </span>
                <span className="readout text-[0.62rem] uppercase tracking-widest text-muted-foreground">
                  live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                {TELEMETRY.map((t) => (
                  <div key={t.label} className="bg-surface px-5 py-6">
                    <div className="readout text-3xl font-semibold text-foreground">
                      {t.value}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5 px-5 py-5">
                {[
                  { label: "Prompt vault", status: "500+ prompts" },
                  { label: "Automation kits", status: "11 industries" },
                  { label: "Guides & courses", status: "ready" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-muted-foreground">
                      <span className="status-dot" aria-hidden />
                      {row.label}
                    </span>
                    <span className="readout text-xs text-foreground">{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The catalog</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Six modules. {catalogCount} tools. One command center.
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden shrink-0 text-sm font-medium text-accent hover:underline sm:inline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const sample = products.find((p) => p.category === cat.id);
              const count = products.filter((p) => p.category === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="panel lift group flex items-start gap-4 p-5 hover:border-accent"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-accent">
                    <ProductIcon name={sample?.icon ?? "sparkles"} className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold tracking-tight text-foreground">{cat.label}</h3>
                      <span className="readout text-[0.62rem] text-muted-foreground">{count}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FLAGSHIP: EASY AI BOOK ───────────────────────────────── */}
      {flagship && (
        <section className="border-b border-border bg-surface py-20 lg:py-24">
          <div className="container-page grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Book cover, CSS */}
            <div className="mx-auto w-full max-w-[280px]">
              <div className="panel relative aspect-[3/4] overflow-hidden rounded-lg border-border-strong bg-gradient-to-br from-surface-2 to-background p-6 shadow-[0_30px_60px_-24px_rgba(20,20,40,0.35)]">
                <div className="relative flex h-full flex-col">
                  <span className="readout text-[0.62rem] uppercase tracking-[0.2em] text-accent">
                    FutureDeskAI
                  </span>
                  <span className="mt-auto text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    Malachi&rsquo;s
                  </span>
                  <h3 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">
                    EASY <span className="text-accent">AI</span>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Prompt Mastery for Beginners
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="status-dot" aria-hidden />
                    <span className="readout text-[0.62rem] text-muted-foreground">
                      18 chapters · 68 pages
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="eyebrow">Flagship</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                The complete guide to using AI — with zero jargon.
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
                {flagship.longDescription}
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {flagship.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/products/${flagship.slug}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  Get the book — {formatPrice(flagship.price)}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {flagship.originalPrice && (
                  <span className="readout text-sm text-muted-foreground">
                    <span className="line-through">{formatPrice(flagship.originalPrice)}</span>{" "}
                    <span className="text-active">
                      save {formatPrice(flagship.originalPrice - flagship.price)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── PAIN → FIX ───────────────────────────────────────────── */}
      <section className="border-b border-border py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Why it matters</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Every day without a system quietly costs you.
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Each tool here targets one of the money-and-time leaks that hit
              professionals and local businesses hardest.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PAINS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.cost} className="panel flex items-start gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground line-through decoration-border-strong">
                      {p.cost}
                    </p>
                    <p className="mt-1 font-medium text-foreground">{p.fix}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────── */}
      <section className="border-b border-border py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Best sellers</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Start with what&rsquo;s working
              </h2>
            </div>
            <Link href="/products" className="shrink-0 text-sm font-medium text-accent hover:underline">
              All {catalogCount} →
            </Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              From checkout to results in three steps
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="panel p-6">
                <span className="readout text-sm font-semibold text-accent">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Download className="h-4 w-4 text-accent" /> Instant delivery</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Secure Stripe checkout</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> One-time payment</span>
          </div>
        </div>
      </section>

      {/* ── FOUNDER ──────────────────────────────────────────────── */}
      <section className="border-b border-border py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="eyebrow">Built by an operator</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Made by someone who needed it to work
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              I&rsquo;m Malachi. FutureDeskAI started because I watched hard-working
              people — tradespeople, small-business owners, professionals —
              lose hours and leads to work that AI can handle in seconds, if
              someone just hands them the exact tools. So that&rsquo;s what this is:
              no fluff, no jargon, no hype. Just tools that do the work.
            </p>
            <Link href="/about" className={buttonVariants({ variant: "outline", className: "mt-7" })}>
              Read the story
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="panel p-8">
            <div className="flex flex-col gap-4">
              {[
                { k: "Approach", v: "Practical over hype" },
                { k: "Pricing", v: "Buy once, own it" },
                { k: "Support", v: "Real, human replies" },
                { k: "Promise", v: "Tools that ship results" },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="eyebrow eyebrow-muted">{row.k}</span>
                  <span className="text-sm font-medium text-foreground">{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Field reports</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Real results from real businesses
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="panel flex flex-col p-6">
                <div className="mb-4 flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="readout grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-2 text-xs font-semibold text-accent">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="grid-blueprint absolute inset-0 opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[130px]"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 70%)" }}
          aria-hidden
        />
        <div className="container-page relative text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop paying for time you could automate.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Pick one tool, put it to work today, and feel the difference by the
            end of the week.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/products" className={buttonVariants({ size: "lg" })}>
              Browse all products
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/local-business" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Find my industry kit
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
