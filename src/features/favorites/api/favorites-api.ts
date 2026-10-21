import { queryOptions } from "@tanstack/react-query";

import { favoritesResponseSchema, type FavoritesResponse } from "@/features/favorites/api/schemas";
import { http } from "@/shared/api/axios";
import { AppError } from "@/shared/api/errors";
import { favoriteKeys } from "@/shared/api/query-keys";

export async function fetchFavorites(signal: AbortSignal): Promise<FavoritesResponse> {
  const response = await http.get("/favorites", { signal });
  const parsed = favoritesResponseSchema.safeParse(response.data);
  if (!parsed.success) throw new AppError("CONTRACT_MISMATCH", parsed.error);
  return parsed.data;
}

export const favoritesQueryOptions = queryOptions({
  queryKey: favoriteKeys.list(),
  queryFn: ({ signal }) => fetchFavorites(signal),
  // Private and changed only by this user's own actions, which invalidate it.
  staleTime: 60_000,
});
