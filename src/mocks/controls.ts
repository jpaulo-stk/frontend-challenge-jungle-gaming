import Big from "big.js";

import { getConfig, saveConfig, type ScenarioId } from "@/mocks/config";
import { getDb, mutate, resetDb } from "@/mocks/db/store";
import { cancelScenarioEvent, changeNft } from "@/mocks/domain/nfts";
import { cancelSettlements, settleOrder } from "@/mocks/domain/orders";
import { seedRandom } from "@/mocks/lib/random";
import { nftUpdatedEvent, publish, republishLast } from "@/mocks/socket/bus";
import { dropRealtimeConnections, realtimeClientCount } from "@/mocks/socket/realtime-server";
import type { EditionId } from "@/shared/api/contracts/nft";

// Control surface of the simulated backend, used by the dev panel and by the
// Playwright tests (`window.__kurioMock`). Every action changes the mock
// database or the mock server; events still reach the app through
// socket.io-client, never through application state.

export const mockControls = {
  config: () => getConfig(),

  /** Restores the current scenario's data from scratch. */
  reset(): void {
    cancelSettlements();
    cancelScenarioEvent();
    seedRandom(getConfig().seed);
    resetDb(getConfig().scenario);
  },

  /** Switches scenario and resets its data. Reload the page to restart the app clean. */
  setScenario(scenario: ScenarioId): void {
    saveConfig({ ...getConfig(), scenario });
    mockControls.reset();
  },

  setNftPrice(nftId: string, price: string): void {
    changeNft(nftId, { price: new Big(price).toFixed() });
  },

  raiseNftPrice(nftId: string, percent = 10): void {
    const nft = getDb().nfts.find((candidate) => candidate.id === nftId);
    if (!nft) return;
    const price = new Big(nft.price)
      .times(100 + percent)
      .div(100)
      .round(2, Big.roundHalfUp);
    changeNft(nftId, { price: price.toFixed() });
  },

  setEditionAvailability(nftId: string, editionId: EditionId, available: number): void {
    changeNft(nftId, { editions: { [editionId]: available } });
  },

  /** Settles a pending order now (used with `?settle=manual`). */
  settleOrder(orderId: string, outcome: "confirmed" | "rejected") {
    return settleOrder(orderId, outcome);
  },

  pendingOrders: () =>
    getDb()
      .orders.filter((order) => order.status === "pending")
      .map((order) => order.id),

  /** Delivers the last event again, unchanged (duplicate). */
  replayLastEvent(): void {
    republishLast();
  },

  /** Sends an event older than the NFT's current version, with a bogus price. */
  sendStaleNftEvent(nftId: string): void {
    const nft = getDb().nfts.find((candidate) => candidate.id === nftId);
    if (!nft || nft.version < 2) return;
    publish(nftUpdatedEvent({ ...nft, version: nft.version - 1, price: "0.01" }));
  },

  /** Closes realtime connections; socket.io-client reconnects on its own. */
  dropConnections: () => dropRealtimeConnections(),

  connectedClients: () => realtimeClientCount(),

  /** The next private request ends the current session with a 401. */
  expireSessionOnNextRequest(): void {
    mutate((db) => {
      db.flags.sessionExpiryArmed = true;
    });
  },

  orderCount: () => getDb().orders.length,

  cartOf(userId: string) {
    return getDb().cartItems.filter((item) => item.owner === `user:${userId}`);
  },

  nft: (nftId: string) => structuredClone(getDb().nfts.find((candidate) => candidate.id === nftId)),
};

export type MockControls = typeof mockControls;

declare global {
  // Declaration merging with the DOM `Window` requires an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __kurioMock?: MockControls;
  }
}

export function installControls(): void {
  window.__kurioMock = mockControls;
}
