import { z } from "zod";

import { imageSchema } from "@/shared/api/contracts/common";
import { nftSummarySchema } from "@/shared/api/contracts/nft";

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  /** Long-form text of the "Detalhes do NFT" tab, one entry per paragraph. */
  story: z.array(z.string()),
  creatorName: z.string(),
  /** Artist series shown as "Coleção" on the detail page (e.g. "Kurio Apes"). */
  seriesName: z.string(),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
  }),
  attributes: z.array(z.string()),
  contractAddress: z.string(),
  royaltiesPercent: z.number().nonnegative(),
  /** Main art first, followed by the gallery thumbnails. */
  gallery: z.array(imageSchema).min(1),
});
export type NftDetail = z.infer<typeof nftDetailSchema>;
