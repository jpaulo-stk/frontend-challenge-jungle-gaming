import type { Socket } from "socket.io-client";

import { REALTIME_URL } from "@/shared/config/realtime";

// socket.io-client is imported on demand: it captures the WebSocket constructor,
// which must happen after MSW has started
export async function createRealtimeSocket(token: string | null): Promise<Socket> {
  const { io } = await import("socket.io-client");
  return io(REALTIME_URL, {
    transports: ["websocket"],
    auth: token ? { token } : {},
    autoConnect: false,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    // Fail after 5s instead of 20s so the offline notice shows
    timeout: 5000,
  });
}
