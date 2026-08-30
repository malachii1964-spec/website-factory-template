import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function NotConfiguredNotice({ feature }: { feature: string }) {
  return (
    <section className="py-24">
      <div className="container-page max-w-lg text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-harvest/30 bg-harvest-tint text-harvest">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-medium tracking-tight">{feature} isn&rsquo;t connected yet</h1>
        <p className="mt-3 text-muted-foreground">
          This farm&rsquo;s database hasn&rsquo;t been set up. Add a{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">DATABASE_URL</code> to the
          environment to turn this on.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-8" })}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
