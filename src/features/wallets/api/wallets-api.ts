import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { http } from "@/shared/api/axios";
import {
  walletAddressSchema,
  walletSchema,
  type Wallet,
  type WalletInput,
  type WalletRole,
  type WalletsResponse,
} from "@/shared/api/contracts/wallet";
import type { AppError } from "@/shared/api/errors";
import { parseContract } from "@/shared/api/parse-contract";
import { walletKeys } from "@/shared/api/query-keys";

/** Form of the "Carteiras" page; selects start empty, so their messages are explicit. */
export const walletFormSchema = z.object({
  displayName: z.string().trim().min(1, "Informe o nome de exibição."),
  nickname: z.string().trim().min(1, "Informe o apelido da carteira."),
  network: z.enum(["ethereum", "polygon", "solana"], { error: "Selecione uma rede." }),
  profileName: z.string().trim().min(1, "Informe o nome do perfil."),
  address: walletAddressSchema,
  alternateAddress: z.string().trim(),
  provider: z.enum(["metamask", "walletconnect", "coinbase"], { error: "Selecione uma carteira." }),
  referralCode: z.string().trim().min(1, "Informe o código de indicação."),
  email: z.email("Informe um e-mail válido."),
  ensName: z.string().trim().min(1, "Informe o nome ENS."),
});
export type WalletFormInput = z.input<typeof walletFormSchema>;
export type WalletFormOutput = z.output<typeof walletFormSchema>;

export const toWalletInput = (values: WalletFormOutput): WalletInput => ({
  ...values,
  alternateAddress: values.alternateAddress || null,
});

type SaveWalletInput = { role: WalletRole; existingId: string | null; values: WalletInput };

/** Creates the wallet of a role, or updates it when it already exists. */
export function useSaveWallet() {
  const queryClient = useQueryClient();
  return useMutation<Wallet, AppError, SaveWalletInput>({
    mutationFn: async ({ role, existingId, values }) => {
      const response = existingId
        ? await http.patch(`/wallets/${existingId}`, values)
        : await http.post("/wallets", { ...values, role });
      return parseContract(walletSchema, response.data);
    },
    onSuccess: (wallet) => {
      queryClient.setQueryData<WalletsResponse>(walletKeys.list(), (current) => ({
        primary: current?.primary ?? null,
        secondary: current?.secondary ?? null,
        [wallet.role]: wallet,
      }));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: walletKeys.list() }),
  });
}
