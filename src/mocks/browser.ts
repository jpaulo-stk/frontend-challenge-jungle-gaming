import { setupWorker } from "msw/browser";

import { loadConfig } from "@/mocks/config";
import { installControls } from "@/mocks/controls";
import { loadDb } from "@/mocks/db/store";
import { resumePendingOrders } from "@/mocks/domain/orders";
import { handlers } from "@/mocks/handlers";
import { seedRandom } from "@/mocks/lib/random";

/**
 * Boots the simulated backend: configuration from the URL, database from
 * storage (or a fresh scenario seed), then the service worker. Must resolve
 * before the app renders (its first requests) and before socket.io-client is
 * imported, so it picks up the intercepted WebSocket.
 */
export async function startMocks(): Promise<void> {
  const { config, resetRequested } = loadConfig(window.location);
  seedRandom(config.seed);
  loadDb(config.scenario, resetRequested);
  resumePendingOrders();

  await setupWorker(...handlers).start({
    quiet: true,
    serviceWorker: { url: "/mockServiceWorker.js" },
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith("/api/")) print.error();
    },
  });

  installControls();

  if (import.meta.env.DEV || config.panel) {
    const { mountMockPanel } = await import("@/mocks/panel/mount");
    mountMockPanel();
  }
}
