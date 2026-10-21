import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { facetsResponseSchema, type NftListParams } from "@/features/catalog/api/schemas";
import { http } from "@/shared/api/axios";
import { nftListResponseSchema } from "@/shared/api/contracts/nft";
import { parseContract } from "@/shared/api/parse-contract";
import { nftKeys } from "@/shared/api/query-keys";

/**
 * Catalog page for exactly these parameters. The key mirrors what is sent, so
 * a late response for older filters can never land in the current list, and
 * the AbortSignal cancels the superseded request.
 */
export const nftListQueryOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) =>
      parseContract(nftListResponseSchema, (await http.get("/nfts", { params, signal })).data),
    // Keep showing the previous page while the next one loads (no skeleton flash).
    placeholderData: keepPreviousData,
  });

export const facetsQueryOptions = queryOptions({
  queryKey: nftKeys.facets(),
  queryFn: async ({ signal }) =>
    parseContract(facetsResponseSchema, (await http.get("/facets", { signal })).data),
  // Counters barely move; a few minutes of staleness is fine.
  staleTime: 5 * 60_000,
});

const featuredParams = { sort: "trending", perPage: 1 } as const;

/** "NFT em destaque": the top trending piece. */
export const featuredQueryOptions = queryOptions({
  queryKey: nftKeys.list(featuredParams),
  queryFn: async ({ signal }) =>
    parseContract(
      nftListResponseSchema,
      (await http.get("/nfts", { params: featuredParams, signal })).data,
    ).items[0] ?? null,
});
