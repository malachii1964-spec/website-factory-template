import type { ReactNode } from "react";
import { SiteFooterLinks } from "@/components/shell/app-shell";
import { Wordmark } from "@/components/wordmark";

export default function InfoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <Wordmark className="text-3xl" />
      <main id="main" className="py-10">
        <article className="space-y-4 leading-relaxed text-foreground/90 [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:uppercase [&_h1]:tracking-wide [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:text-accent [&_a]:underline">
          {children}
        </article>
      </main>
      <SiteFooterLinks />
    </div>
  );
}
