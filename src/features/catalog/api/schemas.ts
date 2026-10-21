import { z } from "zod";

import { ethAmountSchema, networkSchema } from "@/shared/api/contracts/common";

export const CATALOG_PAGE_SIZE = 12;

export const catalogSortSchema = z.enum(["recent", "price_asc", "price_desc", "trending"]);
export type CatalogSort = z.infer<typeof catalogSortSchema>;

export const catalogTabSchema = z.enum(["all", "new", "trending"]);
export type CatalogTab = z.infer<typeof catalogTabSchema>;

export const nftListParamsSchema = z.object({
  q: z.string().trim().min(1).optional(),
  collection: z.array(z.string()).optional(),
  network: z.array(networkSchema).optional(),
  priceMin: ethAmountSchema.optional(),
  priceMax: ethAmountSchema.optional(),
  tab: catalogTabSchema.default("all"),
  sort: catalogSortSchema.default("recent"),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(48).default(CATALOG_PAGE_SIZE),
});
export type NftListParams = z.infer<typeof nftListParamsSchema>;

export const facetsResponseSchema = z.object({
  collections: z.array(z.object({ slug: z.string(), name: z.string(), count: z.number().int() })),
  networks: z.array(z.object({ id: networkSchema, name: z.string(), count: z.number().int() })),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
});
export type FacetsResponse = z.infer<typeof facetsResponseSchema>;
