import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { http } from "@/shared/api/axios";
import { cartSchema, type Cart, type Quote } from "@/shared/api/contracts/cart";
import type { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { cartKeys } from "@/shared/api/query-keys";
import { mulEth } from "@/shared/lib/eth";
import { fetchQuote } from "@/shared/cart/quote-api";

type CartContext = { previous: Cart | undefined };

function useOptimisticCart() {
  const queryClient = useQueryClient();
  return {
    queryClient,
    apply: async (change: (cart: Cart) => Cart): Promise<CartContext> => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });
      const previous = queryClient.getQueryData<Cart>(cartKeys.detail());
      if (previous) queryClient.setQueryData(cartKeys.detail(), change(previous));
      return { previous };
    },
    rollback: (context: CartContext | undefined) => {
      if (context?.previous) queryClient.setQueryData(cartKeys.detail(), context.previous);
    },
  };
}

const recount = (cart: Cart): Cart => ({
  ...cart,
  itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
});

export function useUpdateCartItem() {
  const cart = useOptimisticCart();
  return useMutation<Cart, AppError, { itemId: string; quantity: number }, CartContext>({
    mutationFn: async ({ itemId, quantity }) =>
      parseContract(cartSchema, (await http.patch(`/cart/items/${itemId}`, { quantity })).data),
    onMutate: ({ itemId, quantity }) =>
      cart.apply((current) =>
        recount({
          ...current,
          items: current.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity, lineTotal: mulEth(item.unitPrice, quantity) }
              : item,
          ),
        }),
      ),
    onError: (error, _input, context) => {
      cart.rollback(context);
      toast.error(error.message);
    },
    onSuccess: (updated) => {
      cart.queryClient.setQueryData(cartKeys.detail(), updated);
    },
    onSettled: () => cart.queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useRemoveCartItem() {
  const cart = useOptimisticCart();
  return useMutation<Cart, AppError, { itemId: string; name: string }, CartContext>({
    mutationFn: async ({ itemId }) =>
      parseContract(cartSchema, (await http.delete(`/cart/items/${itemId}`)).data),
    onMutate: ({ itemId }) =>
      cart.apply((current) =>
        recount({ ...current, items: current.items.filter((item) => item.id !== itemId) }),
      ),
    onError: (error, _input, context) => {
      cart.rollback(context);
      toast.error(error.message);
    },
    onSuccess: (updated, { name }) => {
      cart.queryClient.setQueryData(cartKeys.detail(), updated);
      toast.success(`${name} saiu do carrinho.`);
    },
    onSettled: () => cart.queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useApplyCoupon() {
  return useMutation<Quote, AppError, string>({
    mutationFn: (couponCode) => fetchQuote({ couponCode }),
  });
}
