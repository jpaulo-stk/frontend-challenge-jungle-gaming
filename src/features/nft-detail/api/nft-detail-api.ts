import { queryOptions } from "@tanstack/react-query";

import { nftDetailSchema } from "@/features/nft-detail/api/schemas";
import { http } from "@/shared/api/axios";
import { nftListResponseSchema } from "@/shared/api/contracts/nft";
import { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { nftKeys } from "@/shared/api/query-keys";

export const nftDetailQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: async ({ signal }) =>
      parseContract(nftDetailSchema, (await http.get(`/nfts/${nftId}`, { signal })).data),
    staleTime: 30_000,
    retry: (failureCount, error) =>
      !(error instanceof AppError && error.code === "NFT_NOT_FOUND") && failureCount < 2,
  });

const relatedParams = { sort: "trending", perPage: 16 } as const;

export const relatedNftsQueryOptions = queryOptions({
  queryKey: nftKeys.list(relatedParams),
  queryFn: async ({ signal }) =>
    parseContract(
      nftListResponseSchema,
      (await http.get("/nfts", { params: relatedParams, signal })).data,
    ),
  staleTime: 60_000,
});
