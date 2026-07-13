import { Home, Phone } from "lucide-react";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { Container } from "@/components/Section";
import { ButtonLink } from "@/components/Button";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden text-paper">
      <HeroBackdrop />
      <Container className="relative text-center">
        <p className="eyebrow justify-center text-grow">
          <span aria-hidden className="h-px w-8 bg-grow" />
          Lost in the greenhouse
        </p>
        <h1 className="mt-5 font-display text-6xl font-medium tracking-tight sm:text-8xl">404</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-paper/80">
          This page didn&rsquo;t take root. Let&rsquo;s get you back to something growing.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" variant="primary" size="lg">
            <Home size={17} aria-hidden />
            Back home
          </ButtonLink>
          <ButtonLink
            href="/plants"
            variant="outline"
            size="lg"
            className="border-paper/30 text-paper hover:bg-paper hover:text-fir"
          >
            Browse plants
          </ButtonLink>
          <ButtonLink
            href={site.phoneHref}
            variant="ghost"
            size="lg"
            className="text-paper hover:bg-paper/10"
          >
            <Phone size={17} aria-hidden />
            {site.phone}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
