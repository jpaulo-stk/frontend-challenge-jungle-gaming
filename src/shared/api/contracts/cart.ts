import { z } from "zod";

import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  networkSchema,
} from "@/shared/api/contracts/common";
import { editionIdSchema } from "@/shared/api/contracts/nft";

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  network: networkSchema,
  editionId: editionIdSchema,
  editionLabel: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: ethAmountSchema,
  /** Price when the item was added; differs from `unitPrice` after a price change. */
  addedUnitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  available: z.number().int().nonnegative(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  itemCount: z.number().int().nonnegative(),
  version: z.number().int().nonnegative(),
});
export type Cart = z.infer<typeof cartSchema>;

export const addCartItemRequestSchema = z.object({
  nftId: z.string(),
  editionId: editionIdSchema,
  quantity: z.number().int().positive(),
});
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>;

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
});
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;

export const quoteRequestSchema = z.object({
  couponCode: z.string().trim().min(1).nullable(),
  itemIds: z.array(z.string()).min(1).optional(),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const quoteIssueSchema = z.discriminatedUnion("code", [
  z.object({
    code: z.literal("PRICE_CHANGED"),
    itemId: z.string(),
    nftId: z.string(),
    previousPrice: ethAmountSchema,
    currentPrice: ethAmountSchema,
  }),
  z.object({
    code: z.literal("EDITION_SOLD_OUT"),
    itemId: z.string(),
    nftId: z.string(),
  }),
  z.object({
    code: z.literal("INSUFFICIENT_AVAILABILITY"),
    itemId: z.string(),
    nftId: z.string(),
    requested: z.number().int().positive(),
    available: z.number().int().nonnegative(),
  }),
]);
export type QuoteIssue = z.infer<typeof quoteIssueSchema>;

export const quoteLineSchema = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: editionIdSchema,
  quantity: z.number().int().positive(),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
});
export type QuoteLine = z.infer<typeof quoteLineSchema>;

export const quoteSchema = z.object({
  quoteId: z.string(),
  lines: z.array(quoteLineSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  coupon: z.object({ code: z.string(), percentOff: z.number().int().positive() }).nullable(),
  expiresAt: isoDateTimeSchema,
  issues: z.array(quoteIssueSchema),
});
export type Quote = z.infer<typeof quoteSchema>;
