import { cn } from "cn";

import type { CatalogSort, CatalogTab } from "@/features/catalog/api/schemas";
import { useCatalogFilters } from "@/features/catalog/hooks/use-catalog-filters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const tabs: { value: CatalogTab; label: string }[] = [
  { value: "all", label: "Todos os NFTs" },
  { value: "new", label: "Novos lançamentos" },
  { value: "trending", label: "Em alta" },
];

const sorts: { value: CatalogSort; label: string }[] = [
  { value: "recent", label: "Listados recentemente" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "trending", label: "Em alta" },
];

/** Lists ("Todos os NFTs / Novos lançamentos / Em alta") and the sort order. */
export function CatalogToolbar() {
  const { search, updateFilters } = useCatalogFilters();
  const activeTab = search.tab ?? "all";

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      {/* The lists filter the same grid, so they are toggle buttons rather than ARIA tabs. */}
      <div role="group" aria-label="Lista de NFTs" className="flex gap-4 overflow-x-auto md:gap-5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={activeTab === tab.value}
            onClick={() => {
              updateFilters({ tab: tab.value === "all" ? undefined : tab.value });
            }}
            className={cn(
              "shrink-0 border-b-2 pb-0.5 text-sm font-bold whitespace-nowrap transition-colors md:text-[15px]",
              activeTab === tab.value
                ? "border-primary-hi text-primary-hi"
                : "border-transparent text-text hover:text-primary-hi",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 text-[15px] text-text">
        <span id="catalog-sort-label">Ordenar por:</span>
        <Select
          value={search.sort ?? "recent"}
          onValueChange={(sort) => {
            updateFilters({ sort: sort === "recent" ? undefined : (sort as CatalogSort) });
          }}
        >
          <SelectTrigger
            aria-labelledby="catalog-sort-label"
            className="h-9 w-auto gap-1 border-0 bg-transparent px-1 text-[15px] md:h-9"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {sorts.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
