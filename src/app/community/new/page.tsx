import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { PostComposer } from "@/components/post-composer";
import { getSessionUser } from "@/lib/session";
import { getDirectory } from "@/lib/strain-directory";

export const metadata: Metadata = {
  title: "Post an update",
  description: "Share a grow update with the community.",
};

export default async function NewPostPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/community/new");

  const strainNames = getDirectory().map((d) => d.name);

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Community
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          Post an update
        </h1>
        <p className="mt-3 text-frost-dim">
          Every post is public and shows up in the Latest feed and to your
          followers.
        </p>
        <PostComposer strainNames={strainNames} />
      </main>
      <OsFooter />
    </div>
  );
}
