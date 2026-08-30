"use client";

import Link from "next/link";
import { Loader2, LogOut, Package, Sprout, User } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { AuthForms } from "@/components/auth-forms";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <section className="py-24">
        <div className="container-page flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-sm text-center">
            <h1 className="text-3xl font-medium tracking-tight">Your account</h1>
            <p className="mt-3 text-muted-foreground">
              Sign in to track orders and manage your Harvest Box subscription.
            </p>
          </div>
          <div className="mt-8">
            <AuthForms />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="container-page max-w-2xl">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-leaf-tint text-leaf">
            <User className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-medium tracking-tight">{session.user.name}</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link href="/account/orders" className="panel lift flex items-start gap-3 p-5">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-lake" />
            <div>
              <h2 className="font-medium text-foreground">Order history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                See what you&rsquo;ve bought from the farm stand.
              </p>
            </div>
          </Link>
          <Link href="/account/subscription" className="panel lift flex items-start gap-3 p-5">
            <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-leaf" />
            <div>
              <h2 className="font-medium text-foreground">Harvest Box CSA</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your weekly subscription.
              </p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => signOut().then(() => window.location.reload())}
          className={cn(buttonVariants({ variant: "outline" }), "mt-10")}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </section>
  );
}
