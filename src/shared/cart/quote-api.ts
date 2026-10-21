import { queryOptions } from "@tanstack/react-query";

import { http } from "@/shared/api/axios";
import { quoteSchema, type Quote, type QuoteRequest } from "@/shared/api/contracts/cart";
import { parseContract } from "@/shared/api/parse-contract";
import { cartKeys } from "@/shared/api/query-keys";

export async function fetchQuote(request: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  const response = await http.post("/cart/quote", request, signal ? { signal } : {});
  return parseContract(quoteSchema, response.data);
}

type QuoteParams = QuoteRequest & {
  cartVersion: number;
};

// Keyed by cart version, so any cart change asks for a new quote
export const quoteQueryOptions = ({ cartVersion, ...request }: QuoteParams) =>
  queryOptions({
    queryKey: cartKeys.quote({ ...request, cartVersion }),
    queryFn: ({ signal }) => fetchQuote(request, signal),
    staleTime: 30_000,
  });
