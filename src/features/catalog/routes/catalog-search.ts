import { z } from "zod";

import {
  CATALOG_PAGE_SIZE,
  catalogSortSchema,
  catalogTabSchema,
  type NftListParams,
} from "@/features/catalog/api/schemas";
import { ethAmountSchema, networkSchema } from "@/shared/api/contracts/common";

const stringList = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]));

// Invalid values are dropped instead of breaking the page
export const catalogSearchSchema = z.object({
  q: z.string().trim().min(1).max(80).optional().catch(undefined),
  collection: stringList
    .pipe(z.array(z.string().min(1)).min(1))
    .optional()
    .catch(undefined),
  network: stringList.pipe(z.array(networkSchema).min(1)).optional().catch(undefined),
  priceMin: ethAmountSchema.optional().catch(undefined),
  priceMax: ethAmountSchema.optional().catch(undefined),
  tab: catalogTabSchema.optional().catch(undefined),
  sort: catalogSortSchema.optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
});
export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

export function toListParams(search: CatalogSearch): NftListParams {
  return {
    ...(search.q ? { q: search.q } : {}),
    ...(search.collection ? { collection: search.collection } : {}),
    ...(search.network ? { network: search.network } : {}),
    ...(search.priceMin ? { priceMin: search.priceMin } : {}),
    ...(search.priceMax ? { priceMax: search.priceMax } : {}),
    tab: search.tab ?? "all",
    sort: search.sort ?? "recent",
    page: search.page ?? 1,
    perPage: CATALOG_PAGE_SIZE,
  };
}

export function hasActiveFilters(search: CatalogSearch): boolean {
  return Boolean(
    search.q ?? search.collection ?? search.network ?? search.priceMin ?? search.priceMax,
  );
}
