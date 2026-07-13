import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlantArt } from "./PlantArt";
import type { CategoryId } from "@/lib/plants";

export function CategoryCard({
  id,
  label,
  blurb,
  hue,
}: {
  id: CategoryId;
  label: string;
  blurb: string;
  hue: number;
}) {
  return (
    <Link
      href={`/plants?category=${id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-mist bg-white/50 transition-colors hover:border-leaf/40"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <div className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
          <PlantArt category={id} hue={hue} label={label} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl text-canopy">{label}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-loam-soft">{blurb}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf">
          Browse
          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
