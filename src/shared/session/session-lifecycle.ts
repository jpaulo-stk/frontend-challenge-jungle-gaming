import type { QueryClient } from "@tanstack/react-query";

import type { Session } from "@/shared/api/contracts/session";
import { sessionKeys } from "@/shared/api/query-keys";
import { clearSessionToken, writeSessionToken } from "@/shared/api/session-token";

// Identity changes (login, register, logout, expiry) always drop the whole
// query cache before the new identity is applied: no favorite, cart, profile
// or order of the previous collector can render, not even for one frame.

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

/** Notified on every identity change (the realtime client reconnects on it). */
export function onIdentityChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function startSession(queryClient: QueryClient, session: Session, token: string): void {
  queryClient.clear();
  writeSessionToken(token);
  queryClient.setQueryData(sessionKeys.current(), session);
  for (const listener of listeners) listener(session);
}

export function endSession(queryClient: QueryClient): void {
  clearSessionToken();
  queryClient.clear();
  queryClient.setQueryData(sessionKeys.current(), null);
  for (const listener of listeners) listener(null);
}
