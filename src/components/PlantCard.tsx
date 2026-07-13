import { PlantArt } from "./PlantArt";
import { lightLabel, type Plant } from "@/lib/plants";
import { cn } from "@/lib/cn";

export function PlantCard({ plant, className }: { plant: Plant; className?: string }) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-mist bg-white/60 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(22,58,34,0.5)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
          <PlantArt category={plant.category} hue={plant.hue} label={plant.name} />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-fir/85 px-2.5 py-1 text-[0.7rem] font-semibold text-paper backdrop-blur-sm">
          {plant.season}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl text-canopy">{plant.name}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-loam-soft">{plant.blurb}</p>
        <div className="mt-4 flex items-center justify-between border-t border-mist pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-leaf">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sprout" />
            {lightLabel[plant.light]}
          </span>
          <span className="font-semibold text-canopy tabular-nums">{plant.price}</span>
        </div>
      </div>
    </article>
  );
}
