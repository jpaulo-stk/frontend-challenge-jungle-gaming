import { getRouteApi } from "@tanstack/react-router";

import type { CatalogSearch } from "@/features/catalog/routes/catalog-search";

const routeApi = getRouteApi("/");

type FilterPatch = Partial<Omit<CatalogSearch, "page">>;

/**
 * Catalog state lives in the URL. `updateFilters` is the single way to change
 * a filter, and it always returns to page 1.
 */
export function useCatalogFilters() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const updateFilters = (patch: FilterPatch, options: { replace?: boolean } = {}) => {
    void navigate({
      search: (previous) => ({ ...previous, ...patch, page: undefined }),
      replace: options.replace ?? false,
      resetScroll: false,
    });
  };

  const clearFilters = () => {
    void navigate({
      search: { tab: search.tab, sort: search.sort },
      resetScroll: false,
    });
  };

  const goToPage = (page: number) => {
    void navigate({ search: (previous) => ({ ...previous, page: page > 1 ? page : undefined }) });
  };

  return { search, updateFilters, clearFilters, goToPage };
}
