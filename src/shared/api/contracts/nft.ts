import { z } from "zod";

import {
  ethAmountSchema,
  imageSchema,
  networkSchema,
  pagedResponseSchema,
} from "@/shared/api/contracts/common";

export const editionIdSchema = z.enum(["1-1", "1-10", "1-50", "open"]);
export type EditionId = z.infer<typeof editionIdSchema>;

export const editionSchema = z.object({
  id: editionIdSchema,
  label: z.string(),
  available: z.number().int().nonnegative(),
});
export type Edition = z.infer<typeof editionSchema>;

export const collectionRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.nullable(),
  rare: z.boolean(),
  collection: collectionRefSchema,
  network: networkSchema,
  editions: z.array(editionSchema),
  available: z.number().int().nonnegative(),
  version: z.number().int().positive(),
});
export type NftSummary = z.infer<typeof nftSummarySchema>;

export const nftListResponseSchema = pagedResponseSchema(nftSummarySchema);
export type NftListResponse = z.infer<typeof nftListResponseSchema>;
