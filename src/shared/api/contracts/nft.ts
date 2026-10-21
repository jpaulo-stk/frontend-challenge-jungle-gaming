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
  /** Label shown on the chip: "1/1", "1/10", "1/50", "ABERTA". */
  label: z.string(),
  /** Units still available for purchase. 0 means sold out. */
  available: z.number().int().nonnegative(),
});
export type Edition = z.infer<typeof editionSchema>;

export const collectionRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

/** NFT as listed in the catalog, favorites and carousels. */
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
  /** Total available units across editions. */
  available: z.number().int().nonnegative(),
  /** Incremented on every price or availability change; used to order realtime events. */
  version: z.number().int().positive(),
});
export type NftSummary = z.infer<typeof nftSummarySchema>;

export const nftListResponseSchema = pagedResponseSchema(nftSummarySchema);
export type NftListResponse = z.infer<typeof nftListResponseSchema>;
