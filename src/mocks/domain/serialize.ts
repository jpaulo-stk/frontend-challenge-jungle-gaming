import Big from "big.js";

import type { DbCartItem, DbNft, DbOrder, DbUser, DbWallet, OwnerKey } from "@/mocks/db/types";
import { getDb } from "@/mocks/db/store";
import { artImage } from "@/mocks/fixtures/art";
import { collections, networkNames } from "@/mocks/fixtures/nfts";
import type { FacetsResponse } from "@/features/catalog/api/schemas";
import type { SessionUser } from "@/shared/api/contracts/session";
import type { NftDetail } from "@/features/nft-detail/api/schemas";
import type { Profile } from "@/features/profile/api/schemas";
import type { Cart, CartItem } from "@/shared/api/contracts/cart";
import type { NftSummary } from "@/shared/api/contracts/nft";
import type { Order } from "@/shared/api/contracts/order";
import type { Wallet } from "@/shared/api/contracts/wallet";

// Internal records → public contract shapes. Nothing private (password hashes,
// owners, idempotency data) leaves the mock through these functions.

export function totalAvailable(nft: DbNft): number {
  return nft.editions.reduce((sum, edition) => sum + edition.available, 0);
}

export function collectionName(slug: string): string {
  return collections.find((collection) => collection.slug === slug)?.name ?? slug;
}

export function toNftSummary(nft: DbNft): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    tokenId: nft.tokenId,
    image: artImage(nft.art, nft.name),
    price: nft.price,
    previousPrice: nft.previousPrice,
    rare: nft.rare,
    collection: { slug: nft.collectionSlug, name: collectionName(nft.collectionSlug) },
    network: nft.network,
    editions: structuredClone(nft.editions),
    available: totalAvailable(nft),
    version: nft.version,
  };
}

export function toNftDetail(nft: DbNft): NftDetail {
  const image = artImage(nft.art, nft.name);
  return {
    ...toNftSummary(nft),
    description: nft.description,
    story: [
      `${nft.name} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${networkNames[nft.network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${nft.creatorName} recebe ${String(nft.royaltiesPercent)}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    creatorName: nft.creatorName,
    seriesName: nft.seriesName,
    rating: nft.rating,
    attributes: nft.attributes,
    contractAddress: nft.contractAddress,
    royaltiesPercent: nft.royaltiesPercent,
    // The Figma gallery repeats the main art in its four thumbnails.
    gallery: [1, 2, 3, 4].map((view) => ({
      ...image,
      alt: `${image.alt} (vista ${String(view)} de 4)`,
    })),
  };
}

export function toFacets(nfts: DbNft[]): FacetsResponse {
  const prices = nfts.map((nft) => new Big(nft.price));
  const min = prices.reduce((low, price) => (price.lt(low) ? price : low), prices[0] ?? new Big(0));
  const max = prices.reduce(
    (high, price) => (price.gt(high) ? price : high),
    prices[0] ?? new Big(0),
  );
  return {
    collections: collections.map((collection) => ({
      ...collection,
      count: nfts.filter((nft) => nft.collectionSlug === collection.slug).length,
    })),
    networks: (["ethereum", "polygon", "solana"] as const).map((id) => ({
      id,
      name: { ethereum: "Ethereum", polygon: "Polygon", solana: "Solana" }[id],
      count: nfts.filter((nft) => nft.network === id).length,
    })),
    priceRange: { min: min.toFixed(), max: max.toFixed() },
  };
}

function toCartItem(item: DbCartItem): CartItem | null {
  const nft = getDb().nfts.find((candidate) => candidate.id === item.nftId);
  const edition = nft?.editions.find((candidate) => candidate.id === item.editionId);
  if (!nft || !edition) return null;
  return {
    id: item.id,
    nftId: nft.id,
    name: nft.name,
    tokenId: nft.tokenId,
    image: artImage(nft.art, nft.name),
    network: nft.network,
    editionId: edition.id,
    editionLabel: edition.label,
    quantity: item.quantity,
    unitPrice: nft.price,
    addedUnitPrice: item.addedUnitPrice,
    lineTotal: new Big(nft.price).times(item.quantity).toFixed(),
    available: edition.available,
  };
}

export function toCart(owner: OwnerKey): Cart {
  const db = getDb();
  const items = db.cartItems
    .filter((item) => item.owner === owner)
    .map(toCartItem)
    .filter((item): item is CartItem => item !== null);
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    version: db.cartVersions[owner] ?? 0,
  };
}

export function toSessionUser(user: DbUser): SessionUser {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export function toProfile(user: DbUser): Profile {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
    version: user.version,
  };
}

export function toWallet(wallet: DbWallet): Wallet {
  const { userId: _owner, ...publicWallet } = wallet;
  return structuredClone(publicWallet);
}

export function toOrder(order: DbOrder): Order {
  const {
    userId: _owner,
    idempotencyKey: _key,
    requestHash: _hash,
    buyer: _buyer,
    settleAt: _settleAt,
    ...publicOrder
  } = order;
  return structuredClone(publicOrder);
}
