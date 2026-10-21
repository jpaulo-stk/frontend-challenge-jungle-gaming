import { io, type Socket } from "socket.io-client";

import { REALTIME_URL } from "@/shared/config/realtime";

/**
 * Socket.IO client for realtime updates. WebSocket transport only (no HTTP
 * long-polling); the session token travels in the handshake
 * `auth`, so the server knows whose order events this connection may receive.
 */
export function createRealtimeSocket(token: string | null): Socket {
  return io(REALTIME_URL, {
    transports: ["websocket"],
    auth: token ? { token } : {},
    autoConnect: false,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  });
}
