import { queryOptions } from "@tanstack/react-query";

import { favoritesResponseSchema, type FavoritesResponse } from "@/shared/api/contracts/favorites";
import { http } from "@/shared/api/axios";
import { parseContract } from "@/shared/api/parse-contract";
import { favoriteKeys } from "@/shared/api/query-keys";

export async function fetchFavorites(signal: AbortSignal): Promise<FavoritesResponse> {
  const response = await http.get("/favorites", { signal });
  return parseContract(favoritesResponseSchema, response.data);
}

export const favoritesQueryOptions = queryOptions({
  queryKey: favoriteKeys.list(),
  queryFn: ({ signal }) => fetchFavorites(signal),
  staleTime: 60_000,
});
