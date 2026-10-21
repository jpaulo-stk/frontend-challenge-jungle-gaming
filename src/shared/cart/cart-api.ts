import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { http } from "@/shared/api/axios";
import { cartSchema, type AddCartItemRequest, type Cart } from "@/shared/api/contracts/cart";
import type { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { cartKeys } from "@/shared/api/query-keys";

const parseCart = (data: unknown): Cart => parseContract(cartSchema, data);

export const cartQueryOptions = queryOptions({
  queryKey: cartKeys.detail(),
  queryFn: async ({ signal }) => parseCart((await http.get("/cart", { signal })).data),
  // Kept fresh by mutations and price/availability events; short window otherwise.
  staleTime: 15_000,
});

type AddToCartInput = AddCartItemRequest & { name: string };

/** Adds an NFT edition to the cart; availability is enforced by the API. */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation<Cart, AppError, AddToCartInput>({
    mutationFn: async ({ nftId, editionId, quantity }) =>
      parseCart((await http.post("/cart/items", { nftId, editionId, quantity })).data),
    onSuccess: (cart, { name, quantity }) => {
      queryClient.setQueryData(cartKeys.detail(), cart);
      toast.success(
        quantity === 1
          ? `${name} foi adicionado ao carrinho.`
          : `${String(quantity)} × ${name} adicionados ao carrinho.`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}
