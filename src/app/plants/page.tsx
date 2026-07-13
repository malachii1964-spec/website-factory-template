import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/Section";
import { PlantCatalog } from "@/components/PlantCatalog";
import { categories, type CategoryId } from "@/lib/plants";

export const metadata: Metadata = {
  title: "Plants & Garden Catalog",
  description:
    "Browse Mike's Nursery — annuals, perennials, trees & shrubs, vegetable starts, hanging baskets, houseplants, and hydroponics supplies, grown in Lakewood, NY.",
};

const validCategories = new Set<string>(categories.map((c) => c.id));

function normalizeCategory(value: string | string[] | undefined): CategoryId | "all" {
  const v = Array.isArray(value) ? value[0] : value;
  return v && validCategories.has(v) ? (v as CategoryId) : "all";
}

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const initial = normalizeCategory(category);

  return (
    <>
      <PageHero
        eyebrow="The catalog"
        title="Find your next plant"
        intro="A living look at what fills our three greenhouses. Selection changes with the season — call ahead if you're after something specific and we'll check the benches."
      />
      <section className="py-14 sm:py-16">
        <Container>
          <Suspense fallback={<CatalogSkeleton />}>
            <PlantCatalog initialCategory={initial} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-mist bg-white/40">
          <div className="aspect-[4/3] animate-pulse bg-mist/60" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-mist/60" />
            <div className="h-3 w-full animate-pulse rounded bg-mist/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
