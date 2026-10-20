import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Feed } from "@/components/post/feed";
import { PageHeader } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/queries";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const viewer = await getViewer();
  return (
    <>
      <PageHeader title="Explore" />
      {viewer ? null : (
        <div className="border-b border-border px-5 py-5">
          <p className="font-semibold">You&apos;re looking around as a guest.</p>
          <p className="mt-1 text-sm text-muted">Join to post, follow people and like what&apos;s ripening.</p>
          <Link href="/signup" className={buttonVariants({ size: "sm", className: "mt-3" })}>Join GANJALOKA</Link>
        </div>
      )}
      <Feed
        kind={{ type: "explore" }}
        empty={
          <EmptyState title="Nothing here yet">
            <p>No one has posted yet. {viewer ? "Be the first — say hi from your Home feed." : "Join and be the first."}</p>
          </EmptyState>
        }
      />
    </>
  );
}
