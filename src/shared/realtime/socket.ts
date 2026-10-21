import type { Socket } from "socket.io-client";

import { REALTIME_URL } from "@/shared/config/realtime";

/**
 * Socket.IO client for realtime updates. WebSocket transport only (no HTTP
 * long-polling); the session token travels in the handshake
 * `auth`, so the server knows whose order events this connection may receive.
 *
 * socket.io-client is loaded here, on demand: it captures the WebSocket
 * constructor when imported, which must happen after the simulated backend
 * (when enabled) has started. main.tsx loads the app in parallel with it.
 */
export async function createRealtimeSocket(token: string | null): Promise<Socket> {
  const { io } = await import("socket.io-client");
  return io(REALTIME_URL, {
    transports: ["websocket"],
    auth: token ? { token } : {},
    autoConnect: false,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  });
}
