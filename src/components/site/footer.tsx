import { Wordmark } from "@/components/site/wordmark";
import { site, coverage, formatPhone, telHref } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            One local call gets almost anything legal picked up, delivered, or
            handled — anywhere in Chautauqua County. Locally owned in Westfield.
          </p>
          <a
            href={telHref(site.phoneDigits)}
            className="mt-5 inline-flex items-center gap-2 font-display text-xl font-bold text-foreground hover:text-accent"
          >
            {formatPhone(site.phoneDigits)}
          </a>
          <p className="readout mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot" aria-hidden />
            On shift · {site.hours[0].days} {site.hours[0].time}
          </p>
        </div>

        <div>
          <h3 className="eyebrow eyebrow-muted mb-4">We cover</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {coverage.map((town) => (
              <li key={town}>{town}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow eyebrow-muted mb-4">The runs</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li><a href="#services" className="transition-colors hover:text-foreground">All services</a></li>
            <li><a href="#how" className="transition-colors hover:text-foreground">How it works</a></li>
            <li><a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a></li>
            <li><a href="#carry" className="transition-colors hover:text-foreground">What we can &amp; can&rsquo;t carry</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} {site.name}. Locally owned in {site.base}.</p>
          <p className="readout">One call. Consider it done.</p>
        </div>
      </div>
    </footer>
  );
}
