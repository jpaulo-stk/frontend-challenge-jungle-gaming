import { queryOptions } from "@tanstack/react-query";

import { http } from "@/shared/api/axios";
import { walletsResponseSchema } from "@/shared/api/contracts/wallet";
import { parseContract } from "@/shared/api/parse-contract";
import { walletKeys } from "@/shared/api/query-keys";

export const walletsQueryOptions = queryOptions({
  queryKey: walletKeys.list(),
  queryFn: async ({ signal }) =>
    parseContract(walletsResponseSchema, (await http.get("/wallets", { signal })).data),
  staleTime: 60_000,
});
