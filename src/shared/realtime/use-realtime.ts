import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

import type { RealtimeClient, RealtimeState } from "@/shared/realtime/realtime-client";

export const RealtimeContext = createContext<RealtimeClient | null>(null);

function useRealtimeClient(): RealtimeClient {
  const client = useContext(RealtimeContext);
  if (!client) throw new Error("useRealtime* must be used inside RealtimeProvider");
  return client;
}

/** Connection status, for the indicator and for fallbacks (polling while offline). */
export function useRealtimeState(): RealtimeState {
  const client = useRealtimeClient();
  return useSyncExternalStore(client.subscribeState, client.getState);
}

/**
 * Keeps the NFTs on screen subscribed to `nft.updated` while the component is
 * mounted; the cleanup leaves the rooms, so no subscription outlives the screen.
 */
export function useNftSubscription(ids: readonly string[]): void {
  const client = useRealtimeClient();
  // A stable key: a new array with the same ids does not resubscribe.
  const key = [...new Set(ids)].sort().join(",");
  useEffect(() => {
    if (!key) return;
    return client.subscribeNfts(key.split(","));
  }, [client, key]);
}
