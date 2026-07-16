import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="py-28">
      <div className="container-page max-w-lg text-center">
        <p className="readout text-sm font-semibold uppercase tracking-widest text-accent">
          Error · 404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          This page went off-grid.
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          The link is broken or the page moved. Let&rsquo;s get you back to
          something useful.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/products" className={buttonVariants()}>
            Browse products
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
