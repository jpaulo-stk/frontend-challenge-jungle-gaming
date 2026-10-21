import { z } from "zod";

import { networkSchema, walletProviderSchema } from "@/shared/api/contracts/common";

export const walletAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Use um endereço 0x seguido de 40 caracteres hexadecimais.");

export const walletRoleSchema = z.enum(["primary", "secondary"]);
export type WalletRole = z.infer<typeof walletRoleSchema>;

/** Editable fields of a wallet, as in the "Carteiras" form. */
export const walletInputSchema = z.object({
  displayName: z.string().trim().min(1, "Informe o nome de exibição."),
  nickname: z.string().trim().min(1, "Informe o apelido da carteira."),
  network: networkSchema,
  profileName: z.string().trim().min(1, "Informe o nome do perfil."),
  address: walletAddressSchema,
  /** "ENS ou carteira secundária (opcional)". */
  alternateAddress: z.string().trim().nullable(),
  provider: walletProviderSchema,
  referralCode: z.string().trim().min(1, "Informe o código de indicação."),
  email: z.email("Informe um e-mail válido."),
  /** ENS name without the ".eth" suffix. */
  ensName: z.string().trim().min(1, "Informe o nome ENS."),
});
export type WalletInput = z.infer<typeof walletInputSchema>;

export const walletSchema = walletInputSchema.extend({
  id: z.string(),
  role: walletRoleSchema,
  version: z.number().int().positive(),
});
export type Wallet = z.infer<typeof walletSchema>;

export const walletsResponseSchema = z.object({
  primary: walletSchema.nullable(),
  secondary: walletSchema.nullable(),
});
export type WalletsResponse = z.infer<typeof walletsResponseSchema>;

export const createWalletRequestSchema = walletInputSchema.extend({ role: walletRoleSchema });
export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>;

/** Simulated provider handshake used by checkout (connect / refuse / disconnect). */
export const walletConnectionRequestSchema = z.object({
  walletId: z.string(),
  provider: walletProviderSchema,
  network: networkSchema,
});
export type WalletConnectionRequest = z.infer<typeof walletConnectionRequestSchema>;

export const walletConnectionSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  provider: walletProviderSchema,
  network: networkSchema,
  status: z.literal("connected"),
});
export type WalletConnection = z.infer<typeof walletConnectionSchema>;
