import Link from "next/link";
import { Monogram } from "@/components/ccc/monogram";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
        className,
      )}
      aria-label="Chautauqua County Courier — home"
    >
      <span className="text-grape transition-transform duration-200 group-hover:-translate-y-0.5">
        <Monogram className="h-6 w-auto" />
      </span>
      {!compact && (
        <span className="font-display text-[1.05rem] font-bold leading-none tracking-tight">
          Chautauqua County <span className="text-grape">Courier</span>
        </span>
      )}
    </Link>
  );
}
