import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { http } from "@/shared/api/axios";
import type { FavoritesResponse } from "@/shared/api/contracts/favorites";
import type { NftSummary } from "@/shared/api/contracts/nft";
import type { AppError } from "@/shared/api/errors";
import { favoriteKeys } from "@/shared/api/query-keys";
import { favoritesQueryOptions } from "@/shared/favorites/favorites-api";
import { useSession } from "@/shared/session/session-api";
import { announce } from "@/shared/lib/announce";

type ToggleInput = { nft: NftSummary; favorite: boolean };
type ToggleContext = { previous: FavoritesResponse | undefined };

/**
 * Favorite state for cards and the detail page. The toggle is optimistic: the
 * heart changes at once and rolls back, with an accessible error, if the API
 * refuses. Success is only announced to screen readers (the heart already
 * shows it); a failure also gets a toast. Visitors are sent to login and
 * brought back afterwards.
 */
export function useFavorites() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession();
  const signedIn = Boolean(session.data);

  const favorites = useQuery({ ...favoritesQueryOptions, enabled: signedIn });
  const ids = new Set(favorites.data?.items.map((item) => item.id));

  const mutation = useMutation<unknown, AppError, ToggleInput, ToggleContext>({
    mutationFn: async ({ nft, favorite }) => {
      if (favorite) await http.post("/favorites", { nftId: nft.id });
      else await http.delete(`/favorites/${nft.id}`);
    },
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.list() });
      const previous = queryClient.getQueryData<FavoritesResponse>(favoriteKeys.list());
      queryClient.setQueryData<FavoritesResponse>(favoriteKeys.list(), (current) => {
        const items = (current?.items ?? []).filter((item) => item.id !== nft.id);
        return { items: favorite ? [nft, ...items] : items };
      });
      return { previous };
    },
    onError: (error, { nft, favorite }, context) => {
      queryClient.setQueryData(favoriteKeys.list(), context?.previous);
      toast.error(
        favorite
          ? `Não foi possível favoritar ${nft.name}. ${error.message}`
          : `Não foi possível remover ${nft.name} dos favoritos. ${error.message}`,
      );
    },
    onSuccess: (_data, { nft, favorite }) => {
      announce(favorite ? `${nft.name} foi favoritado.` : `${nft.name} saiu dos favoritos.`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoriteKeys.list() }),
  });

  const toggle = (nft: NftSummary) => {
    if (!signedIn) {
      void navigate({ to: "/entrar", search: { redirect: location.href } });
      return;
    }
    mutation.mutate({ nft, favorite: !ids.has(nft.id) });
  };

  return { isFavorite: (id: string) => ids.has(id), toggle };
}
