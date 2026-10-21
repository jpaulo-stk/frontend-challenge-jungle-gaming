import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  toWalletInput,
  useSaveWallet,
  walletFormSchema,
  type WalletFormInput,
  type WalletFormOutput,
} from "@/features/wallets/api/wallets-api";
import { walletToForm } from "@/features/wallets/components/wallet-form-values";
import type { Wallet, WalletRole } from "@/shared/api/contracts/wallet";
import { applyServerErrors } from "@/shared/lib/form-errors";
import { Button } from "@/shared/ui/button";
import { EnsField } from "@/shared/ui/ens-field";
import { SelectField, TextField } from "@/shared/ui/form-field";

const networkOptions = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "solana", label: "Solana" },
] as const;

const providerOptions = [
  { value: "metamask", label: "MetaMask" },
  { value: "walletconnect", label: "WalletConnect" },
  { value: "coinbase", label: "Coinbase Wallet" },
] as const;

const fieldNames = [
  "displayName",
  "nickname",
  "network",
  "profileName",
  "address",
  "alternateAddress",
  "provider",
  "referralCode",
  "email",
  "ensName",
] as const;

type WalletFormProps = {
  role: WalletRole;
  existing: Wallet | null;
  defaults: WalletFormInput;
};

/** The ten fields of a wallet, validated locally (0x + 40 hex) and by the API. */
export function WalletForm({ role, existing, defaults }: WalletFormProps) {
  const save = useSaveWallet();
  const [status, setStatus] = useState("");
  const form = useForm<WalletFormInput, unknown, WalletFormOutput>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: defaults,
  });
  const { errors } = form.formState;
  const prefix = role === "primary" ? "Carteira principal" : "Carteira secundária";

  const onSubmit = form.handleSubmit((values) => {
    setStatus("");
    save.mutate(
      { role, existingId: existing?.id ?? null, values: toWalletInput(values) },
      {
        onSuccess: (wallet) => {
          form.reset(walletToForm(wallet));
          setStatus(`${prefix} salva.`);
          toast.success(`${prefix} salva.`);
        },
        onError: (error) => {
          if (!applyServerErrors(error, form.setError, fieldNames)) {
            form.setError("root.server", { message: error.message });
          }
        },
      },
    );
  });

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} aria-label={prefix}>
      {errors.root?.server && (
        <p
          role="alert"
          className="mb-4 rounded-md border-[1.5px] border-danger px-4 py-3 text-sm text-danger"
        >
          {errors.root.server.message}
        </p>
      )}
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <TextField
          label="Nome de exibição"
          required
          error={errors.displayName?.message}
          {...form.register("displayName")}
        />
        <TextField
          label="Apelido da carteira"
          required
          error={errors.nickname?.message}
          {...form.register("nickname")}
        />
        <SelectField
          label="Rede"
          required
          placeholder="Selecione uma rede"
          options={networkOptions}
          error={errors.network?.message}
          {...form.register("network")}
        />
        <TextField
          label="Nome do perfil"
          required
          error={errors.profileName?.message}
          {...form.register("profileName")}
        />
        <TextField
          label="Endereço da carteira"
          required
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          error={errors.address?.message}
          {...form.register("address")}
        />
        <TextField
          label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          error={errors.alternateAddress?.message}
          {...form.register("alternateAddress")}
        />
        <SelectField
          label="Tipo de carteira"
          required
          placeholder="Selecione uma carteira"
          options={providerOptions}
          error={errors.provider?.message}
          {...form.register("provider")}
        />
        <TextField
          label="Código de indicação"
          required
          error={errors.referralCode?.message}
          {...form.register("referralCode")}
        />
        <TextField
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...form.register("email")}
        />
        <EnsField required error={errors.ensName?.message} {...form.register("ensName")} />
      </div>
      <Button type="submit" size="sm" className="mt-8 h-10 px-4 text-sm" disabled={save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar carteira"}
      </Button>
      <p role="status" className="mt-3 min-h-5 text-sm text-success">
        {status}
      </p>
    </form>
  );
}
