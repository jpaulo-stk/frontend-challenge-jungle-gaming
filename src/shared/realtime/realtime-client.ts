import type { QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";

import type { Session } from "@/shared/api/contracts/session";
import { cartKeys, favoriteKeys, nftKeys, orderKeys, sessionKeys } from "@/shared/api/query-keys";
import { createEventApplier } from "@/shared/realtime/apply-events";
import {
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
  realtimeEvents,
} from "@/shared/realtime/events";
import { createRealtimeSocket } from "@/shared/realtime/socket";

export type RealtimeStatus = "connecting" | "online" | "offline";
export type RealtimeState = {
  status: RealtimeStatus;
  /** True once a connection failed or dropped; the UI stays quiet before that. */
  interrupted: boolean;
};

/** Data kept on screen by the API: refetched from REST after a reconnection. */
const reconciledRoots = new Set<unknown>([
  nftKeys.all[0],
  cartKeys.all[0],
  orderKeys.all[0],
  favoriteKeys.all[0],
]);

/**
 * The app's single Socket.IO connection, outside React. It connects once the
 * identity is known (visitor or collector), reconnects with the new identity
 * when it changes, keeps one server subscription per NFT on screen (reference
 * counted, so StrictMode and repeated mounts are harmless) and hands events to
 * the event applier.
 */
export function createRealtimeClient(queryClient: QueryClient) {
  const applier = createEventApplier(queryClient);
  const rooms = new Map<string, number>();
  const stateListeners = new Set<() => void>();
  let state: RealtimeState = { status: "connecting", interrupted: false };
  let socket: Socket | null = null;
  // Identity of the current connection; undefined before the first connect.
  let identity: string | null | undefined;
  let generation = 0;

  const setState = (next: Partial<RealtimeState>) => {
    const merged = { ...state, ...next };
    if (merged.status === state.status && merged.interrupted === state.interrupted) return;
    state = merged;
    for (const listener of stateListeners) listener();
  };

  const currentUserId = () =>
    queryClient.getQueryData<Session | null>(sessionKeys.current())?.user.id ?? null;

  const emitRooms = (event: string, ids: string[]) => {
    if (socket?.connected && ids.length > 0) socket.emit(event, { resource: "nft", ids });
  };

  /** Events received while away are not trusted: what is on screen is fetched again. */
  const reconcile = () =>
    queryClient.invalidateQueries({
      predicate: (query) => reconciledRoots.has(query.queryKey[0]),
    });

  function wire(next: Socket, owner: string | null) {
    let connectedBefore = false;
    // An event for another identity (a connection about to be replaced) never
    // reaches the cache of the collector now signed in.
    const forThisIdentity = () => currentUserId() === owner;

    next.on("connect", () => {
      setState({ status: "online" });
      emitRooms(realtimeEvents.subscribe, [...rooms.keys()]);
      if (connectedBefore) void reconcile();
      connectedBefore = true;
    });
    next.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") setState({ status: "offline", interrupted: true });
    });
    next.on("connect_error", () => {
      setState({ status: "offline", interrupted: true });
    });
    next.io.on("reconnect_attempt", () => {
      setState({ status: "connecting" });
    });

    next.on(realtimeEvents.nftUpdated, (payload: unknown) => {
      const event = nftUpdatedEventSchema.safeParse(payload);
      if (event.success && forThisIdentity()) applier.nftUpdated(event.data);
    });
    next.on(realtimeEvents.orderUpdated, (payload: unknown) => {
      const event = orderUpdatedEventSchema.safeParse(payload);
      if (event.success && forThisIdentity()) applier.orderUpdated(event.data);
    });
  }

  function disconnect() {
    generation += 1;
    identity = undefined;
    if (socket) {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  }

  return {
    /** Idempotent: connecting again with the same identity keeps the connection. */
    connect(userId: string | null, token: string | null) {
      if (identity === userId && socket) return;
      disconnect();
      identity = userId;
      const current = generation;
      setState({ status: "connecting" });
      void createRealtimeSocket(token).then((next) => {
        // A newer connect or a disconnect happened while the client loaded.
        if (current !== generation) {
          next.disconnect();
          return;
        }
        socket = next;
        wire(next, userId);
        next.connect();
      });
    },

    disconnect,

    /** Joins the NFT rooms while the returned cleanup is not called. */
    subscribeNfts(ids: readonly string[]): () => void {
      const added = [...new Set(ids)];
      const fresh = added.filter((id) => !rooms.has(id));
      for (const id of added) rooms.set(id, (rooms.get(id) ?? 0) + 1);
      emitRooms(realtimeEvents.subscribe, fresh);
      return () => {
        const gone: string[] = [];
        for (const id of added) {
          const count = (rooms.get(id) ?? 1) - 1;
          if (count > 0) rooms.set(id, count);
          else {
            rooms.delete(id);
            gone.push(id);
          }
        }
        emitRooms(realtimeEvents.unsubscribe, gone);
      };
    },

    getState: () => state,
    // Arrow functions: handed directly to useSyncExternalStore.
    subscribeState: (listener: () => void): (() => void) => {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
  };
}

export type RealtimeClient = ReturnType<typeof createRealtimeClient>;
