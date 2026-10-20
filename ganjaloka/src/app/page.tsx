import Link from "next/link";
import { SiteFooterLinks } from "@/components/shell/app-shell";
import { Trichome } from "@/components/trichome";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

const RIPENESS = [
  { ripeness: "clear", title: "Clear", text: "Fresh post. Nobody has liked it yet." },
  { ripeness: "milky", title: "Milky", text: "People are into it. Every like counts." },
  { ripeness: "amber", title: "Amber", text: "25+ likes. Ripe — the community says it's ready." },
] as const;

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <header className="flex h-20 items-center justify-between">
        <Wordmark className="text-3xl" />
        <nav className="flex items-center gap-2">
          <Link href="/explore" className={buttonVariants({ variant: "ghost", size: "sm" })}>Explore</Link>
          <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Log in</Link>
        </nav>
      </header>

      <main id="main">
        {params.account === "deleted" ? (
          <p role="status" className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            Your account and everything in it has been deleted. Take care.
          </p>
        ) : null}

        <section className="pb-16 pt-12 sm:pt-20">
          <h1 className="max-w-3xl font-display text-[3.4rem] font-extrabold uppercase leading-[0.9] tracking-wide sm:text-[5.5rem]">
            The cannabis world, grown by its people.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            GANJALOKA is the 21+ social network for cannabis culture. Share the grow, talk strains and sessions, and follow
            the people who know the plant.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>Join GANJALOKA</Link>
            <Link href="/explore" className={buttonVariants({ variant: "outline", size: "lg" })}>Look around first</Link>
          </div>
        </section>

        <section aria-labelledby="ripeness" className="border-t border-border py-16">
          <h2 id="ripeness" className="font-display text-4xl font-extrabold uppercase tracking-wide">Every post ripens</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Growers read trichomes to know when a plant is ready: clear, then milky, then amber. On GANJALOKA, the like
            button is a trichome, and posts ripen the same way.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {RIPENESS.map((r) => (
              <li key={r.title} className="rounded-2xl border border-border bg-surface p-6">
                <Trichome ripeness={r.ripeness} liked={r.ripeness !== "clear"} className="size-14" />
                <h3 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-wide">{r.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{r.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="grown-ups" className="border-t border-border py-16">
          <h2 id="grown-ups" className="font-display text-4xl font-extrabold uppercase tracking-wide">Built for grown-ups</h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">21+ only</dt>
              <dd className="mt-1 leading-relaxed text-muted">Every member confirms their date of birth. Our database rejects anyone under 21.</dd>
            </div>
            <div>
              <dt className="font-semibold">Your photos don&apos;t give away your grow</dt>
              <dd className="mt-1 leading-relaxed text-muted">Location and camera data are stripped from every photo on your device, before it uploads.</dd>
            </div>
            <div>
              <dt className="font-semibold">Culture, not commerce</dt>
              <dd className="mt-1 leading-relaxed text-muted">No buying or selling, no menus, no &ldquo;DM me&rdquo; plugs. Just people and the plant.</dd>
            </div>
            <div>
              <dt className="font-semibold">Report and block on everything</dt>
              <dd className="mt-1 leading-relaxed text-muted">Real moderators review every report, and blocking hides people both ways, everywhere.</dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-border py-16">
          <p className="font-display text-4xl font-extrabold uppercase tracking-wide">Video is coming next.</p>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            Grow tours, sessions and how-tos — then GANJALOKA on iPhone and Android. Join now and keep your username.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg", className: "mt-6" })}>Claim your username</Link>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <SiteFooterLinks />
      </footer>
    </div>
  );
}
