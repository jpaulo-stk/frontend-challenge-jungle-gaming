import Big from "big.js";

import { getConfig, saveConfig, type ScenarioId } from "@/mocks/config";
import { getDb, mutate, resetDb } from "@/mocks/db/store";
import { cancelScenarioEvent, changeNft } from "@/mocks/domain/nfts";
import { cancelSettlements, settleOrder } from "@/mocks/domain/orders";
import { seedRandom } from "@/mocks/lib/random";
import { clearFaults, queueFault } from "@/mocks/scenarios/faults";
import { nftUpdatedEvent, publish, republishLast } from "@/mocks/socket/bus";
import {
  dropRealtimeConnections,
  realtimeClientCount,
  realtimeClients,
} from "@/mocks/socket/realtime-server";
import type { EditionId } from "@/shared/api/contracts/nft";

// Used by the dev panel and Playwright (window.__kurioMock); events still go through socket.io

export const mockControls = {
  config: () => getConfig(),

  reset(): void {
    cancelSettlements();
    cancelScenarioEvent();
    clearFaults();
    seedRandom(getConfig().seed);
    resetDb(getConfig().scenario);
  },

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

  settleOrder(orderId: string, outcome: "confirmed" | "rejected") {
    return settleOrder(orderId, outcome);
  },

  pendingOrders: () =>
    getDb()
      .orders.filter((order) => order.status === "pending")
      .map((order) => order.id),

  replayLastEvent(): void {
    republishLast();
  },

  sendStaleNftEvent(nftId: string): void {
    const nft = getDb().nfts.find((candidate) => candidate.id === nftId);
    if (!nft || nft.version < 2) return;
    publish(nftUpdatedEvent({ ...nft, version: nft.version - 1, price: "0.01" }));
  },

  failNextRequest(method: string, path: string, status = 500): void {
    queueFault({ method, path, status });
  },

  dropConnections: () => dropRealtimeConnections(),

  connectedClients: () => realtimeClientCount(),

  realtimeClients: () => realtimeClients(),

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
