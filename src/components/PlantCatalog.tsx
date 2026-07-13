"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlantCard } from "./PlantCard";
import { plants, categories, type CategoryId } from "@/lib/plants";
import { cn } from "@/lib/cn";

type Filter = CategoryId | "all";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  ...categories.map((c) => ({ id: c.id as Filter, label: c.label })),
];

export function PlantCatalog({ initialCategory = "all" }: { initialCategory?: Filter }) {
  const [active, setActive] = useState<Filter>(initialCategory);
  const router = useRouter();
  const searchParams = useSearchParams();

  const shown = useMemo(
    () => (active === "all" ? plants : plants.filter((p) => p.category === active)),
    [active],
  );

  function select(id: Filter) {
    setActive(id);
    // Keep the URL shareable without a full navigation/scroll jump.
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") params.delete("category");
    else params.set("category", id);
    const qs = params.toString();
    router.replace(qs ? `/plants?${qs}` : "/plants", { scroll: false });
  }

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 mb-10 bg-paper/85 px-4 py-3 backdrop-blur-md sm:top-20 sm:mx-0 sm:rounded-full sm:px-3">
        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter plants by category"
        >
          {filters.map((f) => {
            const isActive = active === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => select(f.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-canopy text-paper"
                    : "bg-white/60 text-loam-soft hover:bg-white hover:text-canopy",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mb-6 text-sm text-loam-soft" aria-live="polite">
        Showing <span className="font-semibold text-canopy">{shown.length}</span>{" "}
        {shown.length === 1 ? "item" : "items"}
        {active !== "all" && (
          <> in {categories.find((c) => c.id === active)?.label}</>
        )}
      </p>

      {shown.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => (
            <PlantCard key={p.id} plant={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-mist bg-white/40 py-16 text-center">
          <p className="text-loam-soft">Nothing in this category yet — check back soon.</p>
        </div>
      )}
    </div>
  );
}
