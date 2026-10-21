import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/shared/session/session-api";

type GuardArgs = {
  context: { queryClient: QueryClient };
  search: { redirect?: string | undefined };
};

export async function redirectIfSignedIn({ context, search }: GuardArgs): Promise<void> {
  const session = await context.queryClient.query(sessionQueryOptions);
  if (session) throw redirect({ to: search.redirect ?? "/", replace: true });
}
