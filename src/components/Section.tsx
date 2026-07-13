import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("eyebrow text-leaf", className)}>
      <span aria-hidden className="h-px w-6 bg-grow" />
      {children}
    </span>
  );
}

/** Section heading block: eyebrow + title + optional intro. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light"; // text tone for the surface it sits on
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <Eyebrow className={cn(align === "center" && "justify-center", tone === "light" && "text-grow")}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={cn(
          "mt-4 text-3xl leading-[1.1] sm:text-4xl md:text-[2.75rem]",
          tone === "light" ? "text-paper" : "text-canopy",
        )}
      >
        {title}
      </h2>
      {intro && (
        <p className={cn("mt-4 text-lg leading-relaxed", tone === "light" ? "text-paper/75" : "text-loam-soft")}>
          {intro}
        </p>
      )}
    </div>
  );
}
