import Big from "big.js";

import { getConfig } from "@/mocks/config";
import { getDb, mutate } from "@/mocks/db/store";
import type { DbNft, OwnerKey } from "@/mocks/db/types";
import { nftUpdatedEvent, publish } from "@/mocks/socket/bus";
import type { EditionId } from "@/shared/api/contracts/nft";

export type NftChange = {
  price?: string;
  /** New available units per edition. */
  editions?: Partial<Record<EditionId, number>>;
};

/**
 * The only way NFT price or availability changes: bumps the version, persists
 * and publishes `nft.updated`, so REST and realtime never disagree.
 */
export function changeNft(nftId: string, change: NftChange): DbNft | null {
  const updated = mutate((db) => {
    const nft = db.nfts.find((candidate) => candidate.id === nftId);
    if (!nft) return null;
    if (change.price !== undefined) nft.price = change.price;
    for (const edition of nft.editions) {
      const available = change.editions?.[edition.id];
      if (available !== undefined) edition.available = Math.max(0, available);
    }
    nft.version += 1;
    return structuredClone(nft);
  });
  if (updated) publish(nftUpdatedEvent(updated));
  return updated;
}

let scenarioTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * price-changed / sold-out: once the first quote exists, change the first item
 * of that cart after the configured delay. Runs at most once per reset.
 */
export function scheduleScenarioEvent(owner: OwnerKey): void {
  const { scenario, eventDelayMs } = getConfig();
  if (scenario !== "price-changed" && scenario !== "sold-out") return;
  if (getDb().flags.scenarioEventFired || scenarioTimer) return;

  const item = getDb().cartItems.find((candidate) => candidate.owner === owner);
  if (!item) return;

  scenarioTimer = setTimeout(() => {
    scenarioTimer = null;
    mutate((db) => {
      db.flags.scenarioEventFired = true;
    });
    const nft = getDb().nfts.find((candidate) => candidate.id === item.nftId);
    if (!nft) return;
    if (scenario === "price-changed") {
      changeNft(nft.id, {
        price: new Big(nft.price).times(1.1).round(2, Big.roundHalfUp).toFixed(),
      });
    } else {
      changeNft(nft.id, { editions: { [item.editionId]: 0 } });
    }
  }, eventDelayMs);
}

export function cancelScenarioEvent(): void {
  if (scenarioTimer) clearTimeout(scenarioTimer);
  scenarioTimer = null;
}
