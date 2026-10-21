import { z } from "zod";

import { ethAmountSchema, isoDateTimeSchema } from "@/shared/api/contracts/common";
import { editionSchema } from "@/shared/api/contracts/nft";
import { orderStatusSchema } from "@/shared/api/contracts/order";

// Every event carries a stable id (for de-duplication), the affected resource
// id and its version (to ignore stale or repeated updates).

export const nftUpdatedEventSchema = z.object({
  eventId: z.string(),
  id: z.string(),
  version: z.number().int().positive(),
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.nullable(),
  available: z.number().int().nonnegative(),
  editions: z.array(editionSchema),
  updatedAt: isoDateTimeSchema,
});
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>;

export const orderUpdatedEventSchema = z.object({
  eventId: z.string(),
  id: z.string(),
  version: z.number().int().positive(),
  status: orderStatusSchema,
  updatedAt: isoDateTimeSchema,
});
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>;

export const realtimeEvents = {
  nftUpdated: "nft.updated",
  orderUpdated: "order.updated",
  subscribe: "subscribe",
  unsubscribe: "unsubscribe",
} as const;

/** Rooms a client can join to receive updates for resources on screen. */
export const subscriptionSchema = z.object({
  resource: z.enum(["nft"]),
  ids: z.array(z.string()),
});
export type Subscription = z.infer<typeof subscriptionSchema>;
