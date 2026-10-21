import { hashKey, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import type { Session } from "@/shared/api/contracts/session";
import { sessionKeys } from "@/shared/api/query-keys";
import { readSessionToken } from "@/shared/api/session-token";
import { createRealtimeClient } from "@/shared/realtime/realtime-client";
import { RealtimeContext } from "@/shared/realtime/use-realtime";

const sessionHash = hashKey(sessionKeys.current());

/**
 * Owns the realtime connection: it opens once the session is known and is
 * replaced whenever the identity changes (login, logout, expiry), so a new
 * collector never shares the previous one's connection.
 *
 * The session is read from the cache without an observer of its own: the
 * router's guards and the layout fetch it. An extra observer mounted above the
 * router would, under StrictMode's double mount, cancel the fetch a guard is
 * awaiting.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [client] = useState(() => createRealtimeClient(queryClient));
  // Only the session query matters here. Queries are created while other
  // components render, so the notification is deferred out of their render.
  const [subscribeSession] = useState(
    () => (onChange: () => void) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === sessionHash) queueMicrotask(onChange);
      }),
  );
  const session = useSyncExternalStore(subscribeSession, () =>
    queryClient.getQueryState<Session | null>(sessionKeys.current()),
  );
  // A failed session check counts as a visitor; the realtime link still serves the catalog.
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
