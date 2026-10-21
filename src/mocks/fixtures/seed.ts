import type { ScenarioId } from "@/mocks/config";
import type { Db } from "@/mocks/db/types";
import { buildNfts } from "@/mocks/fixtures/nfts";
import {
  fixtureCartItems,
  fixtureCoupons,
  fixtureFavorites,
  fixtureOrders,
  fixtureUsers,
  fixtureWallets,
} from "@/mocks/fixtures/users";

export const SCHEMA_VERSION = 3;

/** Fresh database for a scenario. Deep copies, so fixtures are never mutated. */
export function buildSeed(scenario: ScenarioId): Db {
  const copy = <T>(value: T): T => structuredClone(value);

  return {
    schemaVersion: SCHEMA_VERSION,
    users: copy(fixtureUsers),
    sessions: [],
    nfts: buildNfts(),
    cartItems: copy(fixtureCartItems),
    cartVersions: {},
    favorites: copy(fixtureFavorites),
    quotes: [],
    wallets: copy(fixtureWallets),
    connections: [],
    orders: copy(fixtureOrders),
    coupons: copy(fixtureCoupons),
    flags: {
      sessionExpiryArmed: scenario === "session-expired",
      couponExpiresOnNextUse: false,
      scenarioEventFired: false,
    },
  };
}
