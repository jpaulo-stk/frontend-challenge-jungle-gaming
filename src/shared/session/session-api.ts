import { queryOptions, useQuery } from "@tanstack/react-query";

import { http } from "@/shared/api/axios";
import { sessionSchema, type Session } from "@/shared/api/contracts/session";
import { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { sessionKeys } from "@/shared/api/query-keys";
import { readSessionToken } from "@/shared/api/session-token";

/** Current session, or null for visitors. The session is server data. */
async function fetchSession(signal: AbortSignal): Promise<Session | null> {
  if (!readSessionToken()) return null;
  try {
    const response = await http.get("/auth/session", { signal });
    return parseContract(sessionSchema, response.data);
  } catch (error) {
    if (error instanceof AppError && error.status === 401) return null;
    throw error;
  }
}

export const sessionQueryOptions = queryOptions({
  queryKey: sessionKeys.current(),
  queryFn: ({ signal }) => fetchSession(signal),
  // Revalidated on login, logout and 401s; no need to poll it.
  staleTime: 5 * 60_000,
});

export function useSession() {
  return useQuery(sessionQueryOptions);
}
