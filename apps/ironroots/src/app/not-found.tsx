import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="py-28">
      <div className="container-page max-w-lg text-center">
        <p className="eyebrow">Error · 404</p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight">
          This row&rsquo;s gone fallow.
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          The link is broken or the page moved. Let&rsquo;s get you back to
          something useful.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className={buttonVariants()}>
            Shop the harvest
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
