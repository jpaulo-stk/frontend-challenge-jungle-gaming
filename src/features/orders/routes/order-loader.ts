import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { orderQueryOptions } from "@/features/orders/api/order-api";
import { AppError } from "@/shared/api/errors";

type LoaderArgs = {
  context: { queryClient: QueryClient };
  params: { orderId: string };
};

/**
 * Loads the order before the page renders. An order that does not exist, or
 * belongs to another collector (the API answers both with 404), becomes the
 * project's not-found page. An order already in cache (just created at
 * checkout) renders at once; the page revalidates it.
 */
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
