import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Composer } from "@/components/composer";
import { EmptyState, Feed } from "@/components/post/feed";
import { PageHeader } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/queries";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ compose?: string }> }) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  if (!viewer) redirect("/login?next=/home");

  return (
    <>
      <PageHeader title="Home" />
      {viewer.suspended ? null : <Composer viewer={viewer} autoFocus={params.compose === "1"} />}
      <Feed
        kind={{ type: "home" }}
        empty={
          <EmptyState title="Your feed grows with who you follow">
            <p>Follow growers, connoisseurs and creators, and their posts show up here, newest first.</p>
            <Link href="/explore" className={buttonVariants({ className: "mt-6" })}>Find people on Explore</Link>
          </EmptyState>
        }
      />
    </>
  );
}
