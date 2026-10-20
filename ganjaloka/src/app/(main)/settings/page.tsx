import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { UnblockButton } from "@/components/profile-actions";
import { PageHeader } from "@/components/shell/app-shell";
import { getBlockedProfiles, getProfile, getViewer } from "@/lib/queries";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

function Section({ title, description, children, tone }: { title: string; description?: string; children: React.ReactNode; tone?: "danger" }) {
  return (
    <section className={tone === "danger" ? "border-t border-danger/40 px-4 py-6 sm:px-5" : "border-t border-border px-4 py-6 sm:px-5"}>
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/settings");
  const [page, blocked] = await Promise.all([getProfile(viewer.username), getBlockedProfiles()]);

  return (
    <>
      <PageHeader title="Settings" />
      <Section title="Profile" description="This is how other members see you.">
        <ProfileForm viewer={{ id: viewer.id, displayName: viewer.displayName, bio: page?.profile.bio ?? "", avatarPath: viewer.avatarPath }} />
      </Section>
      <Section title="Password">
        <PasswordForm />
      </Section>
      <Section title="Blocked accounts" description="Blocked accounts can't see your posts or interact with you, and you won't see theirs.">
        {blocked.length === 0 ? (
          <p className="text-sm text-muted">You haven&apos;t blocked anyone.</p>
        ) : (
          <ul className="space-y-3">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center gap-3">
                <Avatar path={b.avatar_path} name={b.display_name} size="sm" />
                <Link href={`/u/${b.username}`} className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-semibold">{b.display_name}</span> <span className="text-muted">@{b.username}</span>
                </Link>
                <UnblockButton profileId={b.id} username={b.username} />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section
        title="Delete account"
        tone="danger"
        description="Permanently deletes your account, profile, posts, photos, likes and follows. Your replies are removed too. This can't be undone."
      >
        <DeleteAccountForm />
      </Section>
    </>
  );
}
