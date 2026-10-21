import { useMutation } from "@tanstack/react-query";

import { http } from "@/shared/api/axios";
import { orderSchema, type Order } from "@/shared/api/contracts/order";
import {
  walletConnectionSchema,
  type WalletConnection,
  type WalletConnectionRequest,
} from "@/shared/api/contracts/wallet";
import type { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import type { OrderAttempt } from "@/shared/checkout/checkout-draft";

export function useConnectWallet() {
  return useMutation<WalletConnection, AppError, WalletConnectionRequest>({
    mutationFn: async (input) =>
      parseContract(walletConnectionSchema, (await http.post("/wallet-connections", input)).data),
  });
}

export function useDisconnectWallet() {
  return useMutation<unknown, AppError, string>({
    mutationFn: async (connectionId) => {
      await http.delete(`/wallet-connections/${connectionId}`);
    },
  });
}

// No automatic retry: resending is explicit and reuses the same Idempotency-Key
export function useCreateOrder() {
  return useMutation<Order, AppError, OrderAttempt>({
    mutationFn: async ({ key, body }) =>
      parseContract(
        orderSchema,
        (await http.post("/orders", body, { headers: { "Idempotency-Key": key } })).data,
      ),
  });
}
