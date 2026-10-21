import type { DbNft, DbOrder } from "@/mocks/db/types";
import { totalAvailable } from "@/mocks/domain/serialize";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/shared/realtime/events";

// Changes in the mock database are published here; the Socket.IO server
// forwards them to connected clients. REST and events always share the data.

export type OutgoingEvent =
  | { type: "nft.updated"; payload: NftUpdatedEvent }
  | { type: "order.updated"; payload: OrderUpdatedEvent; userId: string };

type Listener = (event: OutgoingEvent) => void;

const listeners = new Set<Listener>();
const history: OutgoingEvent[] = [];

export function onOutgoingEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publish(event: OutgoingEvent): void {
  history.push(event);
  if (history.length > 50) history.shift();
  for (const listener of listeners) listener(event);
}

/** Re-sends an already delivered event, unchanged (duplicate delivery). */
export function republishLast(): OutgoingEvent | null {
  const last = history.at(-1);
  if (last) for (const listener of listeners) listener(last);
  return last ?? null;
}

export function nftUpdatedEvent(nft: DbNft): OutgoingEvent {
  return {
    type: "nft.updated",
    payload: {
      eventId: crypto.randomUUID(),
      id: nft.id,
      version: nft.version,
      price: nft.price,
      previousPrice: nft.previousPrice,
      available: totalAvailable(nft),
      editions: structuredClone(nft.editions),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function orderUpdatedEvent(order: DbOrder): OutgoingEvent {
  return {
    type: "order.updated",
    userId: order.userId,
    payload: {
      eventId: crypto.randomUUID(),
      id: order.id,
      version: order.version,
      status: order.status,
      updatedAt: order.updatedAt,
    },
  };
}
