import { z } from "zod";

import { nftSummarySchema } from "@/shared/api/contracts/nft";

export const favoritesResponseSchema = z.object({
  items: z.array(nftSummarySchema),
});
export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;

export const addFavoriteRequestSchema = z.object({
  nftId: z.string(),
});
export type AddFavoriteRequest = z.infer<typeof addFavoriteRequestSchema>;
