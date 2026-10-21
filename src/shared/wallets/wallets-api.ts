import { queryOptions } from "@tanstack/react-query";

import { http } from "@/shared/api/axios";
import { walletsResponseSchema } from "@/shared/api/contracts/wallet";
import { parseContract } from "@/shared/api/parse-contract";
import { walletKeys } from "@/shared/api/query-keys";

/** Primary and secondary wallets; registered in the profile, used at checkout. */
export const walletsQueryOptions = queryOptions({
  queryKey: walletKeys.list(),
  queryFn: async ({ signal }) =>
    parseContract(walletsResponseSchema, (await http.get("/wallets", { signal })).data),
  // Private and changed only by the collector's own edits, which update the cache.
  staleTime: 60_000,
});
