import Image from "next/image";
import { publicMediaUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

const SIZES = { sm: 32, md: 44, lg: 96 } as const;

export function Avatar({
  path,
  name,
  size = "md",
  className,
}: {
  path: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const box = cn("shrink-0 rounded-full bg-surface-2", className);
  if (path) {
    return (
      <Image
        src={publicMediaUrl("avatars", path)}
        alt=""
        width={px}
        height={px}
        sizes={`${px}px`}
        className={cn(box, "object-cover")}
        style={{ width: px, height: px }}
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={cn(box, "grid place-items-center font-display font-extrabold text-muted")}
      style={{ width: px, height: px, fontSize: px * 0.45 }}
    >
      {initial}
    </span>
  );
}
