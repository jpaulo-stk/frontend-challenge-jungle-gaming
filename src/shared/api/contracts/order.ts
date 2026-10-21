import { z } from "zod";

import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  networkSchema,
  walletProviderSchema,
} from "@/shared/api/contracts/common";
import { editionIdSchema } from "@/shared/api/contracts/nft";

export const orderStatusSchema = z.enum(["pending", "confirmed", "rejected"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const buyerSchema = z.object({
  displayName: z.string().trim().min(1),
  username: z.string().trim().min(1),
  network: networkSchema,
  profileName: z.string().trim().min(1),
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  alternateAddress: z.string().trim().nullable(),
  provider: walletProviderSchema,
  referralCode: z.string().trim().min(1),
  email: z.email(),
  ensName: z.string().trim().min(1),
  note: z.string().trim().max(500).nullable(),
});
export type Buyer = z.infer<typeof buyerSchema>;

export const createOrderRequestSchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  connectionId: z.string(),
  buyer: buyerSchema,
});
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export const orderLineSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  editionId: editionIdSchema,
  editionLabel: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
});
export type OrderLine = z.infer<typeof orderLineSchema>;

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int().positive(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  network: networkSchema,
  wallet: z.object({
    provider: walletProviderSchema,
    address: z.string(),
    label: z.string(),
  }),
  lines: z.array(orderLineSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  coupon: z.object({ code: z.string(), percentOff: z.number().int().positive() }).nullable(),
  transactionHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
});
export type Order = z.infer<typeof orderSchema>;

export const ordersResponseSchema = z.object({ items: z.array(orderSchema) });
export type OrdersResponse = z.infer<typeof ordersResponseSchema>;
