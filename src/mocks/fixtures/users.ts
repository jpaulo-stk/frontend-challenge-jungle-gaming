import { artImage } from "@/mocks/fixtures/art";
import type { DbCartItem, DbFavorite, DbOrder, DbUser, DbWallet } from "@/mocks/db/types";

// Passwords stored as salted SHA-256 only; test credentials are in the README

export const fixtureUsers: DbUser[] = [
  {
    id: "user_colecionador",
    displayName: "Colecionador Kurio",
    username: "colecionador",
    email: "colecionador@kurio.test",
    salt: "c0l3c10n4d0r",
    passwordHash: "ed7f074c3f4da9f6aea3c15ba657ba497377fbd88fc10ec116285bc01342cd4d",
    avatarUrl: null,
    ensName: "colecionador",
    walletNickname: "Cofre principal",
    version: 1,
  },
  {
    id: "user_nova",
    displayName: "Nova Sato",
    username: "nova.sato",
    email: "nova.sato@kurio.test",
    salt: "n0v4s4t0",
    passwordHash: "82cc36225ccb5a3c6efc07f88d55276e8514ace17a1c072c64d4e61f6656d3ee",
    avatarUrl: null,
    ensName: "nova.kurio",
    walletNickname: "Reserva",
    version: 1,
  },
];

// The first collector's cart reproduces the Figma cart frame:
// 2 × 1.19 + 6 × 1.39 + 9 × 1.79 = 26.83 ETH, plus 0.016 fee = 26.846 ETH.
export const fixtureCartItems: DbCartItem[] = [
  {
    id: "item_c1",
    owner: "user:user_colecionador",
    nftId: "emerald-ape-042",
    editionId: "1-50",
    quantity: 2,
    addedUnitPrice: "1.19",
    addedAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: "item_c2",
    owner: "user:user_colecionador",
    nftId: "violet-nomad-314",
    editionId: "1-50",
    quantity: 6,
    addedUnitPrice: "1.39",
    addedAt: "2026-10-15T10:01:00.000Z",
  },
  {
    id: "item_c3",
    owner: "user:user_colecionador",
    nftId: "ivory-baron-088",
    editionId: "open",
    quantity: 9,
    addedUnitPrice: "1.79",
    addedAt: "2026-10-15T10:02:00.000Z",
  },
  {
    id: "item_n1",
    owner: "user:user_nova",
    nftId: "golden-beat-207",
    editionId: "1-50",
    quantity: 1,
    addedUnitPrice: "0.99",
    addedAt: "2026-10-16T18:30:00.000Z",
  },
];

export const fixtureFavorites: DbFavorite[] = [
  { userId: "user_colecionador", nftId: "emerald-ape-042", addedAt: "2026-10-10T09:00:00.000Z" },
  { userId: "user_colecionador", nftId: "neon-vessel-552", addedAt: "2026-10-11T09:00:00.000Z" },
  { userId: "user_nova", nftId: "sage-nomad-009", addedAt: "2026-10-12T09:00:00.000Z" },
  { userId: "user_nova", nftId: "golden-signal-160", addedAt: "2026-10-12T09:05:00.000Z" },
  { userId: "user_nova", nftId: "cosmic-bloom-118", addedAt: "2026-10-12T09:10:00.000Z" },
];

export const fixtureWallets: DbWallet[] = [
  {
    id: "wallet_c_primary",
    userId: "user_colecionador",
    role: "primary",
    displayName: "Colecionador Kurio",
    nickname: "Cofre principal",
    network: "ethereum",
    profileName: "colecionador",
    address: "0xA91F3c7B0d24e5F6a8B9c0D1e2F3a4B5c6D7E82C",
    alternateAddress: null,
    provider: "metamask",
    referralCode: "KURIO-COL",
    email: "colecionador@kurio.test",
    ensName: "colecionador",
    version: 1,
  },
  {
    id: "wallet_n_primary",
    userId: "user_nova",
    role: "primary",
    displayName: "Nova Sato",
    nickname: "Principal",
    network: "ethereum",
    profileName: "nova.sato",
    address: "0x5E21aB9c4D7e0F3a6B8c1D2e4F5a7B9c0D3e6C41",
    alternateAddress: null,
    provider: "coinbase",
    referralCode: "KURIO-NOVA",
    email: "nova.sato@kurio.test",
    ensName: "nova",
    version: 1,
  },
  {
    id: "wallet_n_secondary",
    userId: "user_nova",
    role: "secondary",
    displayName: "Nova Sato",
    nickname: "Reserva",
    network: "polygon",
    profileName: "nova.sato",
    address: "0x3C8dE1f2A4b6C8d0E2f4A6b8C0d2E4f6A8b0C2d9",
    alternateAddress: "nova.kurio.eth",
    provider: "walletconnect",
    referralCode: "KURIO-NOVA",
    email: "nova.sato@kurio.test",
    ensName: "nova.kurio",
    version: 1,
  },
];

export const fixtureOrders: DbOrder[] = [
  {
    id: "order_c_0001",
    userId: "user_colecionador",
    idempotencyKey: "fixture-c-0001",
    requestHash: "fixture",
    status: "confirmed",
    version: 2,
    createdAt: "2026-07-29T14:20:00.000Z",
    updatedAt: "2026-07-29T14:20:04.000Z",
    network: "ethereum",
    wallet: {
      provider: "metamask",
      address: "0xA91F3c7B0d24e5F6a8B9c0D1e2F3a4B5c6D7E82C",
      label: "MetaMask",
    },
    lines: [
      {
        nftId: "golden-frequency-071",
        name: "Golden Frequency #071",
        tokenId: "#0071",
        image: artImage(4, "Golden Frequency #071"),
        editionId: "open",
        editionLabel: "ABERTA",
        quantity: 2,
        unitPrice: "0.59",
        lineTotal: "1.18",
      },
    ],
    subtotal: "1.18",
    discount: "0",
    networkFee: "0.016",
    total: "1.196",
    coupon: null,
    transactionHash: "0x4f7c2a91e0b3d5f6a8c1e2d4b6f8a0c3e5d7f9b1a3c5e7d9f0b2a4c6e8d1f3a5",
    explorerUrl:
      "https://etherscan.io/tx/0x4f7c2a91e0b3d5f6a8c1e2d4b6f8a0c3e5d7f9b1a3c5e7d9f0b2a4c6e8d1f3a5",
    rejectionReason: null,
    buyer: {
      displayName: "Colecionador Kurio",
      username: "colecionador",
      network: "ethereum",
      profileName: "colecionador",
      walletAddress: "0xA91F3c7B0d24e5F6a8B9c0D1e2F3a4B5c6D7E82C",
      alternateAddress: null,
      provider: "metamask",
      referralCode: "KURIO-COL",
      email: "colecionador@kurio.test",
      ensName: "colecionador",
      note: null,
    },
    settleAt: null,
  },
];

export const fixtureCoupons = [
  { code: "KURIO10", percentOff: 10, expired: false },
  { code: "EXPIRADO2025", percentOff: 15, expired: true },
];
