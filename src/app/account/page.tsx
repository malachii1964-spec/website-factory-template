import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { GuideCard } from "@/components/guide-card";
import { SignOutButton } from "@/components/sign-out-button";
import { getSessionUser } from "@/lib/session";
import { listBookmarks } from "@/lib/bookmarks";
import { getAllGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "My Sanctuary",
  description: "Your saved guides and membership dashboard.",
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const saved = await listBookmarks();
  const allGuides = getAllGuides();
  const savedGuides = allGuides.filter((g) => saved.includes(g.slug));
  const memberGuides = allGuides.filter((g) => g.membersOnly);

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
              Member · full library unlocked
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              {user.name}&apos;s sanctuary
            </h1>
            <p className="mt-2 text-sm text-frost-dim">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* quick stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="glass rounded-2xl p-4">
            <p className="font-display text-2xl font-semibold text-frost">
              {savedGuides.length}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-frost-dim">
              Saved guides
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="font-display text-2xl font-semibold text-cyan">
              {memberGuides.length}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-frost-dim">
              Members-only unlocked
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="font-display text-2xl font-semibold text-lime">
              {allGuides.length}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-frost-dim">
              Total guides available
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="font-display text-2xl font-semibold iris-text">
              Full
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-frost-dim">
              Access level
            </p>
          </div>
        </div>

        {/* saved guides */}
        <h2 className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
          Saved guides
        </h2>
        {savedGuides.length === 0 ? (
          <div className="glass iris-border mt-4 rounded-2xl p-10 text-center">
            <p className="font-display text-xl font-semibold">
              Nothing saved yet.
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-frost-dim">
              Hit &ldquo;Save to my almanac&rdquo; on any guide and it&apos;ll
              be waiting here — handy mid-grow when your hands are dirty.
            </p>
            <Link
              href="/guides"
              className="btn-iris mt-6 inline-block rounded-full px-6 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110"
            >
              Browse the guides
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedGuides.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        )}

        {/* quick links */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/grows"
            className="glass group rounded-2xl p-5 transition hover:brightness-110"
          >
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              My grow journals
            </h3>
            <p className="mt-2 text-sm text-frost-dim">
              Your grows, with every top-dress on a date and the amounts worked
              out.
            </p>
          </Link>
          <Link
            href="/start"
            className="glass group rounded-2xl p-5 transition hover:brightness-110"
          >
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-lime">
              Start a new grow
            </h3>
            <p className="mt-2 text-sm text-frost-dim">
              Step-by-step roadmap from seed to harvest.
            </p>
          </Link>
          <Link
            href="/plant-doctor"
            className="glass group rounded-2xl p-5 transition hover:brightness-110"
          >
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan">
              AI Plant Doctor
            </h3>
            <p className="mt-2 text-sm text-frost-dim">
              Describe a symptom and get instant diagnosis.
            </p>
          </Link>
          <Link
            href="/build-my-grow"
            className="glass group rounded-2xl p-5 transition hover:brightness-110"
          >
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">
              Build My Grow
            </h3>
            <p className="mt-2 text-sm text-frost-dim">
              Custom grow plan in 6 questions.
            </p>
          </Link>
        </div>
      </main>
      <OsFooter />
    </div>
  );
}
