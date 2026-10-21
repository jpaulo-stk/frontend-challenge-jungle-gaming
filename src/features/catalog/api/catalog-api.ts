import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { facetsResponseSchema, type NftListParams } from "@/features/catalog/api/schemas";
import { http } from "@/shared/api/axios";
import { nftListResponseSchema } from "@/shared/api/contracts/nft";
import { parseContract } from "@/shared/api/parse-contract";
import { nftKeys } from "@/shared/api/query-keys";

// Key mirrors the params, so a late response for old filters can't land in the current list
export const nftListQueryOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) =>
      parseContract(nftListResponseSchema, (await http.get("/nfts", { params, signal })).data),
    placeholderData: keepPreviousData,
  });

export const facetsQueryOptions = queryOptions({
  queryKey: nftKeys.facets(),
  queryFn: async ({ signal }) =>
    parseContract(facetsResponseSchema, (await http.get("/facets", { signal })).data),
  staleTime: 5 * 60_000,
});

const featuredParams = { sort: "trending", perPage: 1 } as const;

// Keeps the list shape (realtime patches list keys); the card selects the first item
export const featuredQueryOptions = queryOptions({
  queryKey: nftKeys.list(featuredParams),
  queryFn: async ({ signal }) =>
    parseContract(
      nftListResponseSchema,
      (await http.get("/nfts", { params: featuredParams, signal })).data,
    ),
  select: (list) => list.items[0] ?? null,
});
