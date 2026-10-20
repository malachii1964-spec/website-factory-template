"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  icon,
  children,
  variant = "rail",
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: "rail" | "tab";
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  if (variant === "tab") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold",
          active ? "text-accent" : "text-muted",
        )}
      >
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3.5 rounded-full px-4 py-3 text-[1.05rem] transition-colors hover:bg-surface-2",
        active ? "font-semibold text-foreground" : "text-muted hover:text-foreground",
      )}
    >
      <span className={cn(active && "text-accent")}>{icon}</span>
      {children}
    </Link>
  );
}
