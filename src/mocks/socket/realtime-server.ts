import { toSocketIo } from "@mswjs/socket.io-binding";
import { ws } from "msw";

import { getConfig } from "@/mocks/config";
import { getDb } from "@/mocks/db/store";
import { onOutgoingEvent } from "@/mocks/socket/bus";
import { REALTIME_URL } from "@/shared/config/realtime";
import { realtimeEvents, subscriptionSchema } from "@/shared/realtime/events";

// Simulated Socket.IO server. MSW intercepts the WebSocket opened by
// socket.io-client and @mswjs/socket.io-binding speaks the Engine.IO/Socket.IO
// protocol on top of it. There is no real server: events originate from the
// same mock database used by the REST handlers (see ./bus.ts).

/** Server-side heartbeat; without it socket.io-client drops the link after ~30s. */
const PING_INTERVAL_MS = 25_000;

type ConnectedClient = {
  userId: string | null;
  nftRooms: Set<string>;
  emit: (event: string, payload: unknown) => void;
  close: () => void;
};

const clients = new Set<ConnectedClient>();

/** The user behind the token sent in the Socket.IO handshake (`auth.token`). */
function userFromHandshake(data: unknown): string | null {
  if (typeof data !== "string" || !data.startsWith("40")) return null;
  try {
    const auth = JSON.parse(data.slice(2)) as { token?: unknown };
    if (typeof auth.token !== "string") return null;
    const session = getDb().sessions.find((candidate) => candidate.token === auth.token);
    return session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null;
  } catch {
    return null;
  }
}

// MSW strips the "/socket.io/" path before matching, so the link is the origin.
const realtime = ws.link(REALTIME_URL);

export const realtimeHandler = realtime.addEventListener("connection", (connection) => {
  if (getConfig().scenario === "offline") {
    connection.client.close();
    return;
  }

  const io = toSocketIo(connection);
  const client: ConnectedClient = {
    userId: null,
    nftRooms: new Set(),
    emit: (event, payload) => {
      io.client.emit(event, payload);
    },
    close: () => {
      connection.client.close();
    },
  };
  clients.add(client);

  connection.client.addEventListener("message", (event) => {
    const userId = userFromHandshake(event.data);
    if (userId) client.userId = userId;
  });

  io.client.on(realtimeEvents.subscribe, (_event, payload: unknown) => {
    const parsed = subscriptionSchema.safeParse(payload);
    if (parsed.success) for (const id of parsed.data.ids) client.nftRooms.add(id);
  });
  io.client.on(realtimeEvents.unsubscribe, (_event, payload: unknown) => {
    const parsed = subscriptionSchema.safeParse(payload);
    if (parsed.success) for (const id of parsed.data.ids) client.nftRooms.delete(id);
  });

  const heartbeat = setInterval(() => {
    connection.client.send("2");
  }, PING_INTERVAL_MS);

  connection.client.addEventListener("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
});

// NFT updates go to clients subscribed to that NFT (or to every NFT with "*");
// order updates only reach connections authenticated as the order's owner.
onOutgoingEvent((event) => {
  for (const client of clients) {
    if (event.type === "nft.updated") {
      if (client.nftRooms.has(event.payload.id) || client.nftRooms.has("*")) {
        client.emit(realtimeEvents.nftUpdated, event.payload);
      }
    } else if (client.userId === event.userId) {
      client.emit(realtimeEvents.orderUpdated, event.payload);
    }
  }
});

/** Closes every realtime connection (simulates a dropped network link). */
export function dropRealtimeConnections(): number {
  const count = clients.size;
  for (const client of [...clients]) client.close();
  return count;
}

export function realtimeClientCount(): number {
  return clients.size;
}
