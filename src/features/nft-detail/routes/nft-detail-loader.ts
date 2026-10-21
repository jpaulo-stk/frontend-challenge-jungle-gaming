import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { nftDetailQueryOptions } from "@/features/nft-detail/api/nft-detail-api";
import { AppError } from "@/shared/api/errors";

type LoaderArgs = {
  context: { queryClient: QueryClient };
  params: { nftId: string };
};

export async function loadNftDetail({ context, params }: LoaderArgs): Promise<void> {
  try {
    await context.queryClient.query(nftDetailQueryOptions(params.nftId));
  } catch (error) {
    if (error instanceof AppError && error.code === "NFT_NOT_FOUND") throw notFound();
    throw error;
  }
}
