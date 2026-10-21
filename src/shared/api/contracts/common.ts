import { z } from "zod";

/** ETH amounts always travel as decimal strings ("1.19"), never as numbers. */
export const ethAmountSchema = z.string().regex(/^\d+(\.\d+)?$/, "Valor em ETH inválido");

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const networkSchema = z.enum(["ethereum", "polygon", "solana"]);
export type Network = z.infer<typeof networkSchema>;

export const walletProviderSchema = z.enum(["metamask", "walletconnect", "coinbase"]);
export type WalletProvider = z.infer<typeof walletProviderSchema>;

export const imageSchema = z.object({
  src: z.string(),
  srcSet: z.string(),
  alt: z.string(),
});
export type Image = z.infer<typeof imageSchema>;

export function pagedResponseSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    perPage: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
}
