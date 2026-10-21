import { QueryClient } from "@tanstack/react-query";

import { isTransient } from "@/shared/api/errors";

// Per-domain staleTime/gcTime live in each query's options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // catalog data tolerates being 30s old
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => isTransient(error) && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false, // no surprise refetch (and re-quote) during checkout
    },
    mutations: {
      retry: 0, // a retried mutation could duplicate an order
    },
  },
});
