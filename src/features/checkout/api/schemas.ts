import { z } from "zod";

import { walletAddressSchema } from "@/shared/api/contracts/wallet";

export const buyerFormSchema = z.object({
  displayName: z.string().trim().min(1, "Informe o nome de exibição."),
  username: z.string().trim().min(1, "Informe o nome de usuário."),
  network: z.enum(["ethereum", "polygon", "solana"], { error: "Selecione uma rede." }),
  profileName: z.string().trim().min(1, "Informe o nome do perfil."),
  walletAddress: walletAddressSchema,
  alternateAddress: z.string().trim(),
  provider: z.enum(["metamask", "walletconnect", "coinbase"], {
    error: "Selecione uma carteira.",
  }),
  referralCode: z.string().trim().min(1, "Informe o código de indicação."),
  email: z.email("Informe um e-mail válido."),
  ensName: z.string().trim().min(1, "Informe o nome ENS."),
  useOtherWallet: z.boolean(),
  note: z.string().trim().max(500, "Use no máximo 500 caracteres."),
});
export type BuyerFormInput = z.input<typeof buyerFormSchema>;
export type BuyerFormOutput = z.output<typeof buyerFormSchema>;
