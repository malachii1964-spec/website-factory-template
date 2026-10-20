import { Compass, House, LogOut, Plus, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/actions/auth";
import { Avatar } from "@/components/avatar";
import { NavLink } from "@/components/shell/nav-link";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { publicEnv } from "@/lib/env";
import { getNewestMembers, getViewer } from "@/lib/queries";

const icon = "size-6";

export async function AppShell({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const isMod = viewer?.role === "moderator" || viewer?.role === "admin";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1160px] justify-center">
      {/* Left rail (desktop) */}
      <header className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col px-3 py-5 lg:flex">
        <Wordmark href={viewer ? "/home" : "/"} className="px-4 pb-6" />
        <nav aria-label="Main" className="flex flex-col gap-1">
          {viewer ? <NavLink href="/home" icon={<House className={icon} aria-hidden="true" />}>Home</NavLink> : null}
          <NavLink href="/explore" icon={<Compass className={icon} aria-hidden="true" />}>Explore</NavLink>
          {viewer ? (
            <>
              <NavLink href={`/u/${viewer.username}`} icon={<UserRound className={icon} aria-hidden="true" />}>Profile</NavLink>
              <NavLink href="/settings" icon={<Settings className={icon} aria-hidden="true" />}>Settings</NavLink>
            </>
          ) : null}
          {isMod ? <NavLink href="/mod" icon={<ShieldCheck className={icon} aria-hidden="true" />}>Moderation</NavLink> : null}
        </nav>
        {viewer ? (
          <Link href="/home?compose=1" className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
            Post
          </Link>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>Join GANJALOKA</Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>Log in</Link>
          </div>
        )}
        {viewer ? (
          <div className="mt-auto flex items-center gap-3 rounded-full px-3 py-2">
            <Avatar path={viewer.avatarPath} name={viewer.displayName} size="sm" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold">{viewer.displayName}</p>
              <p className="truncate text-muted">@{viewer.username}</p>
            </div>
            <form action={signOut}>
              <button type="submit" aria-label="Log out" title="Log out" className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground">
                <LogOut className="size-5" aria-hidden="true" />
              </button>
            </form>
          </div>
        ) : null}
      </header>

      {/* Center column */}
      <div className="min-w-0 w-full max-w-[620px] border-border pb-24 lg:border-x lg:pb-0">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 lg:hidden">
          <Wordmark href={viewer ? "/home" : "/"} className="text-2xl" />
          {viewer ? (
            <Link href={`/u/${viewer.username}`} aria-label="Your profile">
              <Avatar path={viewer.avatarPath} name={viewer.displayName} size="sm" />
            </Link>
          ) : (
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Log in</Link>
          )}
        </div>
        {viewer?.suspended ? (
          <p role="status" className="border-b border-danger/40 bg-danger/10 px-5 py-3 text-sm">
            Your account is suspended for breaking the Community Guidelines. You can read, but you can&apos;t post or interact.{" "}
            <Link href="/contact" className="underline">Contact us</Link> if you think this is a mistake.
          </p>
        ) : null}
        <main id="main">{children}</main>
      </div>

      {/* Right rail (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-[300px] shrink-0 overflow-y-auto px-6 py-5 xl:block" aria-label="Community">
        <RightRail />
      </aside>

      {/* Bottom tabs (mobile) */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {viewer ? (
          <div className="flex">
            <NavLink variant="tab" href="/home" icon={<House className={icon} aria-hidden="true" />}>Home</NavLink>
            <NavLink variant="tab" href="/explore" icon={<Compass className={icon} aria-hidden="true" />}>Explore</NavLink>
            <Link href="/home?compose=1" className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-muted">
              <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-foreground">
                <Plus className="size-5" aria-hidden="true" />
              </span>
              Post
            </Link>
            <NavLink variant="tab" href={`/u/${viewer.username}`} icon={<UserRound className={icon} aria-hidden="true" />}>Profile</NavLink>
          </div>
        ) : (
          <div className="flex gap-3 p-3">
            <Link href="/signup" className={buttonVariants({ className: "flex-1" })}>Join GANJALOKA</Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", className: "flex-1" })}>Log in</Link>
          </div>
        )}
      </nav>
    </div>
  );
}

async function RightRail() {
  const members = await getNewestMembers(5);
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">House rules</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li><span className="font-semibold text-foreground">21+ only.</span> No exceptions.</li>
          <li><span className="font-semibold text-foreground">No buying or selling.</span> No prices, menus, delivery or &ldquo;DM me&rdquo;.</li>
          <li><span className="font-semibold text-foreground">Protect grows.</span> Never post anyone&apos;s location.</li>
          <li><span className="font-semibold text-foreground">Respect people.</span> No hate, harassment or threats.</li>
        </ul>
        <Link href="/legal/guidelines" className="mt-3 inline-block text-sm text-accent hover:underline">Read the full guidelines</Link>
      </section>
      {members.length > 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">New members</h2>
          <ul className="mt-3 space-y-3">
            {members.map((m) => (
              <li key={m.id}>
                <Link href={`/u/${m.username}`} className="flex items-center gap-3 rounded-xl hover:opacity-80">
                  <Avatar path={m.avatar_path} name={m.display_name} size="sm" />
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-semibold">{m.display_name}</span>
                    <span className="block truncate text-muted">@{m.username}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <SiteFooterLinks />
    </div>
  );
}

export function SiteFooterLinks() {
  return (
    <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-muted">
      <Link href="/legal/terms" className="hover:underline">Terms</Link>
      <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
      <Link href="/legal/guidelines" className="hover:underline">Community Guidelines</Link>
      <Link href="/contact" className="hover:underline">Contact</Link>
      <a href={`mailto:${publicEnv.contactEmail}`} className="hover:underline">{publicEnv.contactEmail}</a>
      <span>© {new Date().getFullYear()} GANJALOKA · 21+</span>
    </nav>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="sticky top-14 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 sm:px-5 lg:top-0">
      <h1 className="font-display text-[1.7rem] font-extrabold uppercase leading-none tracking-wide">{title}</h1>
      {children}
    </div>
  );
}
