import { z } from "zod";

import { imageSchema } from "@/shared/api/contracts/common";
import { nftSummarySchema } from "@/shared/api/contracts/nft";

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  story: z.array(z.string()),
  creatorName: z.string(),
  seriesName: z.string(),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
  }),
  attributes: z.array(z.string()),
  contractAddress: z.string(),
  royaltiesPercent: z.number().nonnegative(),
  gallery: z.array(imageSchema).min(1),
});
export type NftDetail = z.infer<typeof nftDetailSchema>;
