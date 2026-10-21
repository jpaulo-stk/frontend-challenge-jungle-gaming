import { queryOptions } from "@tanstack/react-query";

import { http } from "@/shared/api/axios";
import { orderSchema } from "@/shared/api/contracts/order";
import { parseContract } from "@/shared/api/parse-contract";
import { orderKeys } from "@/shared/api/query-keys";

export const PENDING_POLL_MS = 2_000;

export const orderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: async ({ signal }) =>
      parseContract(orderSchema, (await http.get(`/orders/${orderId}`, { signal })).data),
    staleTime: (query) => (query.state.data?.status === "pending" ? 0 : Infinity),
  });
