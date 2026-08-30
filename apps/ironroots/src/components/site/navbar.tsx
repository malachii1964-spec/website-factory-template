"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBasket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/site/wordmark";
import { useCart } from "@/components/cart-provider";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/csa", label: "CSA" },
  { href: "/growing-guides", label: "Learn to Grow" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "Our Farm" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-harvest"
          aria-label="Lake Erie IronRoots home"
        >
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-lake" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/account"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Account
          </Link>
          <Link href="/cart" className={buttonVariants({ size: "sm" })}>
            <ShoppingBasket className="h-4 w-4" />
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
          >
            <ShoppingBasket className="h-4.5 w-4.5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-harvest px-1 text-[0.6rem] font-bold text-harvest-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-harvest"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-surface-2"
            >
              Account
            </Link>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className={buttonVariants({ size: "md", className: "mt-2 w-full" })}
            >
              Shop the harvest
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
