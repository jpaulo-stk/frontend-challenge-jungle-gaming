import { authHandlers } from "@/mocks/handlers/auth";
import { cartHandlers } from "@/mocks/handlers/cart";
import { catalogHandlers } from "@/mocks/handlers/catalog";
import { favoriteHandlers } from "@/mocks/handlers/favorites";
import { networkConditions } from "@/mocks/handlers/network";
import { orderHandlers } from "@/mocks/handlers/orders";
import { profileHandlers } from "@/mocks/handlers/profile";
import { walletHandlers } from "@/mocks/handlers/wallets";
import { realtimeHandler } from "@/mocks/socket/realtime-server";

// Order matters: network conditions run first and fall through.
export const handlers = [
  networkConditions,
  ...authHandlers,
  ...catalogHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  realtimeHandler,
];
