import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { orderQueryOptions } from "@/features/orders/api/order-api";
import { AppError } from "@/shared/api/errors";

type LoaderArgs = {
  context: { queryClient: QueryClient };
  params: { orderId: string };
};

// 404 for a missing or someone else's order; an order already in cache renders at once
export async function loadOrder({ context, params }: LoaderArgs): Promise<void> {
  const options = orderQueryOptions(params.orderId);
  if (context.queryClient.getQueryData(options.queryKey)) return;
  try {
    await context.queryClient.query(options);
  } catch (error) {
    if (error instanceof AppError && error.code === "ORDER_NOT_FOUND") throw notFound();
    throw error;
  }
}
