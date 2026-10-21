import { useQuery } from "@tanstack/react-query";

import { facetsQueryOptions } from "@/features/catalog/api/catalog-api";
import { FacetChecklist } from "@/features/catalog/components/facet-checklist";
import { PriceFilter } from "@/features/catalog/components/price-filter";
import { useCatalogFilters } from "@/features/catalog/hooks/use-catalog-filters";
import type { Network } from "@/shared/api/contracts/common";
import { Skeleton } from "@/shared/ui/skeleton";

export function CatalogFilters() {
  const { search, updateFilters } = useCatalogFilters();
  const facets = useQuery(facetsQueryOptions);

  if (!facets.data) {
    return (
      <div aria-busy="true" aria-label="Carregando filtros" className="flex flex-col gap-3">
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-8" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <FacetChecklist
        legend="Coleções"
        options={facets.data.collections.map((collection) => ({
          value: collection.slug,
          label: collection.name,
          count: collection.count,
        }))}
        selected={search.collection ?? []}
        onChange={(collection) => {
          updateFilters({ collection: collection.length > 0 ? collection : undefined });
        }}
      />
      <PriceFilter
        // Remount when the applied range changes elsewhere (history, clear filters).
        key={`${search.priceMin ?? ""}-${search.priceMax ?? ""}`}
        bounds={facets.data.priceRange}
        value={{ min: search.priceMin, max: search.priceMax }}
        onApply={updateFilters}
      />
      <FacetChecklist
        legend="Rede"
        options={facets.data.networks.map((network) => ({
          value: network.id,
          label: network.name,
          count: network.count,
        }))}
        selected={search.network ?? []}
        onChange={(network) => {
          updateFilters({ network: network.length > 0 ? (network as Network[]) : undefined });
        }}
      />
    </div>
  );
}
