import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OsHeader } from "@/components/os-header";
import { OsFooter } from "@/components/os-footer";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { getSessionUser } from "@/lib/session";
import { getOrCreateOwnProfile } from "@/lib/social-profiles";
import { SocialTablesMissingError } from "@/lib/social-errors";

export const metadata: Metadata = {
  title: "Community settings",
  description: "Edit your community profile.",
};

export default async function CommunitySettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/community/settings");

  let profile;
  try {
    profile = await getOrCreateOwnProfile();
  } catch (err) {
    if (err instanceof SocialTablesMissingError) {
      return (
        <div className="os-scope min-h-screen bg-void text-frost">
          <OsHeader />
          <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 text-center sm:px-6 lg:pt-32">
            <p className="text-frost-dim">
              The community feature is being switched on — check back shortly.
            </p>
          </main>
          <OsFooter />
        </div>
      );
    }
    throw err;
  }
  if (!profile) redirect("/login?next=/community/settings");

  return (
    <div className="os-scope min-h-screen bg-void text-frost">
      <OsHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Community
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          Your profile
        </h1>
        <p className="mt-3 text-frost-dim">
          This is how you show up in the feed and to other growers.{" "}
          <Link
            href={`/community/u/${profile.handle}`}
            className="text-magenta hover:underline"
          >
            View your public profile →
          </Link>
        </p>
        <ProfileSettingsForm
          initialHandle={profile.handle}
          initialBio={profile.bio ?? ""}
          initialLocation={profile.location ?? ""}
        />
      </main>
      <OsFooter />
    </div>
  );
}
