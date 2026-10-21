import type { QueryClient } from "@tanstack/react-query";
import { redirect, type ParsedLocation } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/shared/session/session-api";

type GuardArgs = {
  context: { queryClient: QueryClient };
  location: ParsedLocation;
};

/** `beforeLoad` guard for private routes; keeps the target so login can resume it. */
export async function requireAuth({ context, location }: GuardArgs): Promise<void> {
  const session = await context.queryClient.query(sessionQueryOptions);
  if (session) return;
  throw redirect({ to: "/entrar", search: { redirect: location.href } });
}
