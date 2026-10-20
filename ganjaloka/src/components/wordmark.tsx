import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("font-display text-[1.65rem] font-extrabold uppercase leading-none tracking-[0.06em]", className)}
      aria-label="GANJALOKA home"
    >
      Ganjaloka
    </Link>
  );
}
