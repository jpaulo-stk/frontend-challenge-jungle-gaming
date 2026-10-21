import type { QueryClient } from "@tanstack/react-query";

import type { Cart } from "@/shared/api/contracts/cart";
import type { FavoritesResponse } from "@/shared/api/contracts/favorites";
import type { NftListResponse, NftSummary } from "@/shared/api/contracts/nft";
import type { Order } from "@/shared/api/contracts/order";
import { cartKeys, favoriteKeys, nftKeys, orderKeys } from "@/shared/api/query-keys";
import { announce } from "@/shared/lib/announce";
import { compareEth, formatEth } from "@/shared/lib/eth";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "@/shared/realtime/events";

type Versioned = { version: number };

/**
 * The only place where realtime events touch the query cache. Every event goes
 * through a version guard: a duplicate (same version) or a stale event (lower
 * version) changes nothing and repeats no effect, and an event never creates
 * cache for something that was not loaded.
 */
export function createEventApplier(queryClient: QueryClient) {
  // Highest version applied per resource. Caches that carry no version (cart,
  // quote) are refreshed from REST, and this keeps that from happening twice.
  const nftVersions = new Map<string, number>();
  const orderVersions = new Map<string, number>();

  /** Highest version of this NFT known anywhere in the cache. */
  function knownNftVersion(id: string): number {
    const versions = [nftVersions.get(id) ?? 0];
    const detail = queryClient.getQueryData<Versioned>(nftKeys.detail(id));
    if (detail) versions.push(detail.version);
    for (const [, list] of queryClient.getQueriesData<NftListResponse>({
      queryKey: nftKeys.lists(),
    })) {
      for (const item of list?.items ?? []) if (item.id === id) versions.push(item.version);
    }
    for (const item of queryClient.getQueryData<FavoritesResponse>(favoriteKeys.list())?.items ??
      []) {
      if (item.id === id) versions.push(item.version);
    }
    return Math.max(...versions);
  }

  function patch<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
    if (nft.id !== event.id || event.version <= nft.version) return nft;
    return {
      ...nft,
      price: event.price,
      previousPrice: event.previousPrice,
      available: event.available,
      editions: event.editions,
      version: event.version,
    };
  }

  /** Lines of the cart with this NFT: refreshed from REST, with a polite announcement. */
  function refreshCart(event: NftUpdatedEvent): void {
    const lines =
      queryClient
        .getQueryData<Cart>(cartKeys.detail())
        ?.items.filter((item) => item.nftId === event.id) ?? [];
    if (lines.length === 0) return;

    const messages: string[] = [];
    const first = lines[0];
    if (first && compareEth(first.unitPrice, event.price) !== 0) {
      messages.push(
        `O preço de ${first.name} no seu carrinho mudou para ${formatEth(event.price)}.`,
      );
    }
    for (const line of lines) {
      const edition = event.editions.find((candidate) => candidate.id === line.editionId);
      if (!edition || edition.available >= line.quantity) continue;
      messages.push(
        edition.available === 0
          ? `${line.name}: a edição ${edition.label} esgotou.`
          : `${line.name}: restam ${String(edition.available)} unidades da edição ${edition.label}.`,
      );
    }
    // Cart and quotes are recalculated by the API (and the checkout revalidates).
    void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    if (messages.length > 0) announce(messages.join(" "));
  }

  return {
    nftUpdated(event: NftUpdatedEvent): boolean {
      if (event.version <= knownNftVersion(event.id)) return false;
      nftVersions.set(event.id, event.version);

      queryClient.setQueryData<NftSummary>(nftKeys.detail(event.id), (previous) =>
        previous ? patch(previous, event) : previous,
      );
      queryClient.setQueriesData<NftListResponse>({ queryKey: nftKeys.lists() }, (previous) =>
        previous
          ? { ...previous, items: previous.items.map((item) => patch(item, event)) }
          : previous,
      );
      queryClient.setQueryData<FavoritesResponse>(favoriteKeys.list(), (previous) =>
        previous
          ? { ...previous, items: previous.items.map((item) => patch(item, event)) }
          : previous,
      );
      refreshCart(event);
      return true;
    },

    /**
     * Orders are only for their owner: an event about an order that is not in
     * this collector's cache is ignored. The event carries only the status, so
     * the full order (transaction, receipt) is fetched again from REST.
     */
    orderUpdated(event: OrderUpdatedEvent): boolean {
      const order = queryClient.getQueryData<Order>(orderKeys.detail(event.id));
      if (!order) return false;
      const known = Math.max(order.version, orderVersions.get(event.id) ?? 0);
      if (event.version <= known) return false;
      orderVersions.set(event.id, event.version);

      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(event.id), exact: true });
      if (event.status === "confirmed")
        void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      return true;
    },
  };
}

export type EventApplier = ReturnType<typeof createEventApplier>;
