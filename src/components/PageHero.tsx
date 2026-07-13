import type { ReactNode } from "react";
import { Container, Eyebrow } from "./Section";

/** Compact dark page header with the grow-light glow — used on interior pages. */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-fir text-paper">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 glow-grow opacity-70 blur-2xl" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-20%,#1c4a2b_0%,transparent_60%)]" />
      <Container className="relative py-16 sm:py-20 md:py-24">
        <Eyebrow className="text-grow">{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-paper/80">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
