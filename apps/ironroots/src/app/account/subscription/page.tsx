import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Sprout } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { csaSubscription } from "@/lib/schema";
import { getCsaPlan } from "@/lib/pricing";
import { NotConfiguredNotice } from "@/components/not-configured-notice";
import { ManageSubscriptionButton } from "@/components/manage-subscription-button";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Harvest Box subscription" };

export default async function SubscriptionPage() {
  if (!auth || !db) {
    return <NotConfiguredNotice feature="CSA subscriptions" />;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/account");

  const subs = await db
    .select()
    .from(csaSubscription)
    .where(eq(csaSubscription.userId, session.user.id));

  const billingConnected = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <section className="py-16 lg:py-20">
      <div className="container-page max-w-2xl">
        <Link href="/account" className="text-sm text-muted-foreground hover:text-lake">
          ← Back to account
        </Link>
        <h1 className="mt-4 text-3xl font-medium tracking-tight">Harvest Box subscription</h1>

        {subs.length === 0 ? (
          <div className="panel mt-8 flex flex-col items-center gap-3 p-10 text-center">
            <Sprout className="h-8 w-8 text-leaf" />
            <p className="text-muted-foreground">
              You&rsquo;re not subscribed to the weekly Harvest Box yet.
            </p>
            <Link href="/csa" className={buttonVariants({ className: "mt-2" })}>
              See the Harvest Box CSA
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {subs.map((s) => {
              const plan = getCsaPlan(s.planId);
              return (
                <div key={s.id} className="panel flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium text-foreground">{plan?.name ?? s.planId}</p>
                    <p className="text-sm text-muted-foreground">Delivered every {plan?.interval ?? "week"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-leaf/30 bg-leaf-tint px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-leaf">
                      {s.status}
                    </span>
                    {billingConnected ? (
                      <ManageSubscriptionButton stripeSubscriptionId={s.stripeSubscriptionId} />
                    ) : null}
                  </div>
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground">
              {billingConnected
                ? "Pause / cancel opens Stripe's secure billing portal, where you can also update your card or delivery frequency."
                : "Billing management isn't connected yet — contact us to pause, change, or cancel your subscription."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
