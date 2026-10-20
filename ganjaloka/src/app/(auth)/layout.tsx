import type { ReactNode } from "react";
import { SiteFooterLinks } from "@/components/shell/app-shell";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Wordmark className="text-3xl" />
      <main id="main" className="flex flex-1 flex-col justify-center py-10">
        {children}
      </main>
      <SiteFooterLinks />
    </div>
  );
}
