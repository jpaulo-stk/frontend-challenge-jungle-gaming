import { hashKey, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import type { Session } from "@/shared/api/contracts/session";
import { sessionKeys } from "@/shared/api/query-keys";
import { readSessionToken } from "@/shared/api/session-token";
import { createRealtimeClient } from "@/shared/realtime/realtime-client";
import { RealtimeContext } from "@/shared/realtime/use-realtime";

const sessionHash = hashKey(sessionKeys.current());

// Reads the session from the cache without its own observer: under StrictMode an
// observer above the router cancels the fetch a route guard is awaiting
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [client] = useState(() => createRealtimeClient(queryClient));
  // Session query only, deferred out of other components' render
  const [subscribeSession] = useState(
    () => (onChange: () => void) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === sessionHash) queueMicrotask(onChange);
      }),
  );
  const session = useSyncExternalStore(subscribeSession, () =>
    queryClient.getQueryState<Session | null>(sessionKeys.current()),
  );
  const resolved = session !== undefined && session.status !== "pending";
  const userId = session?.data?.user.id ?? null;

  useEffect(() => {
    if (!resolved) return;
    client.connect(userId, userId ? readSessionToken() : null);
  }, [client, resolved, userId]);

  useEffect(
    () => () => {
      client.disconnect();
    },
    [client],
  );

  return <RealtimeContext value={client}>{children}</RealtimeContext>;
}
