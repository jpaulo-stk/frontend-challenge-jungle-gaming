import type { QuoteLine } from "@/shared/api/contracts/cart";
import type { Network, WalletProvider } from "@/shared/api/contracts/common";
import type { Edition, EditionId } from "@/shared/api/contracts/nft";
import type { Buyer, Order } from "@/shared/api/contracts/order";
import type { Wallet } from "@/shared/api/contracts/wallet";

export type DbUser = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  salt: string;
  passwordHash: string;
  avatarUrl: string | null;
  ensName: string | null;
  walletNickname: string;
  version: number;
};

export type DbSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type DbNft = {
  id: string;
  name: string;
  tokenId: string;
  art: 1 | 2 | 3 | 4;
  price: string;
  previousPrice: string | null;
  rare: boolean;
  collectionSlug: string;
  network: Network;
  editions: Edition[];
  description: string;
  seriesName: string;
  creatorName: string;
  rating: { average: number; count: number };
  attributes: string[];
  contractAddress: string;
  royaltiesPercent: number;
  releasedAt: string;
  trendingScore: number;
  version: number;
};

export type OwnerKey = `user:${string}` | `visitor:${string}`;

export type DbCartItem = {
  id: string;
  owner: OwnerKey;
  nftId: string;
  editionId: EditionId;
  quantity: number;
  addedUnitPrice: string;
  addedAt: string;
};

export type DbFavorite = {
  userId: string;
  nftId: string;
  addedAt: string;
};

export type DbQuote = {
  id: string;
  owner: OwnerKey;
  itemIds: string[] | null;
  couponCode: string | null;
  percentOff: number | null;
  lines: QuoteLine[];
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  hasIssues: boolean;
  createdAt: string;
  expiresAt: string;
};

export type DbWallet = Wallet & { userId: string };

export type DbWalletConnection = {
  id: string;
  userId: string;
  walletId: string;
  provider: WalletProvider;
  network: Network;
};

export type DbOrder = Order & {
  userId: string;
  idempotencyKey: string;
  requestHash: string;
  buyer: Buyer;
  settleAt: number | null;
};

export type DbCoupon = {
  code: string;
  percentOff: number;
  expired: boolean;
};

export type DbFlags = {
  sessionExpiryArmed: boolean;
  couponExpiresOnNextUse: boolean;
  scenarioEventFired: boolean;
};

export type Db = {
  schemaVersion: number;
  users: DbUser[];
  sessions: DbSession[];
  nfts: DbNft[];
  cartItems: DbCartItem[];
  cartVersions: Record<string, number>;
  favorites: DbFavorite[];
  quotes: DbQuote[];
  wallets: DbWallet[];
  connections: DbWalletConnection[];
  orders: DbOrder[];
  coupons: DbCoupon[];
  flags: DbFlags;
};
