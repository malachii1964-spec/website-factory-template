import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { order } from "@/lib/schema";
import { NotConfiguredNotice } from "@/components/not-configured-notice";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Order history" };

export default async function OrdersPage() {
  if (!auth || !db) {
    return <NotConfiguredNotice feature="Order history" />;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/account");

  const orders = await db
    .select()
    .from(order)
    .where(eq(order.userId, session.user.id))
    .orderBy(desc(order.createdAt));

  return (
    <section className="py-16 lg:py-20">
      <div className="container-page max-w-2xl">
        <Link href="/account" className="text-sm text-muted-foreground hover:text-lake">
          ← Back to account
        </Link>
        <h1 className="mt-4 text-3xl font-medium tracking-tight">Order history</h1>

        {orders.length === 0 ? (
          <div className="panel mt-8 flex flex-col items-center gap-3 p-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet.</p>
            <Link href="/shop" className="font-medium text-lake underline underline-offset-4">
              Shop the harvest
            </Link>
          </div>
        ) : (
          <div className="mt-8 divide-y divide-border border-y border-border">
            {orders.map((o) => (
              <div key={o.id} className="py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {o.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(o.totalCents / 100)}
                  </span>
                </div>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {o.items.map((item) => (
                    <li key={item.slug}>
                      {item.qty}× {item.title}
                    </li>
                  ))}
                </ul>
                <span className="mt-2 inline-block rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
