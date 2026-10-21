import { useWatch, type UseFormReturn } from "react-hook-form";

import type { BuyerFormInput, BuyerFormOutput } from "@/features/checkout/api/schemas";
import { EnsField } from "@/shared/ui/ens-field";
import { FieldShell, SelectField, TextField } from "@/shared/ui/form-field";
import { fieldControlClassName } from "@/shared/ui/input";

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

type BuyerFormProps = {
  form: UseFormReturn<BuyerFormInput, unknown, BuyerFormOutput>;
  onUseOtherWallet: (useOther: boolean) => void;
};

export function BuyerForm({ form, onUseOtherWallet }: BuyerFormProps) {
  const { errors } = form.formState;
  const useOtherWallet = useWatch({ control: form.control, name: "useOtherWallet" });

  return (
    <section aria-labelledby="buyer-title">
      <h2 id="buyer-title" className="text-lg font-bold text-text">
        Perfil do colecionador
      </h2>
      <div className="mt-4 grid gap-x-6 gap-y-5 md:grid-cols-2">
        <TextField
          label="Nome de exibição"
          required
          error={errors.displayName?.message}
          {...form.register("displayName")}
        />
        <TextField
          label="Nome de usuário"
          required
          error={errors.username?.message}
          {...form.register("username")}
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
          readOnly={!useOtherWallet}
          hint={useOtherWallet ? undefined : "Endereço da carteira escolhida ao lado."}
          error={errors.walletAddress?.message}
          {...form.register("walletAddress")}
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

      <label className="mt-6 flex w-fit cursor-pointer items-center gap-2 text-[15px] text-text">
        <input
          type="checkbox"
          className="size-4 appearance-none rounded-full border-[1.5px] border-primary checked:border-5"
          {...form.register("useOtherWallet", {
            onChange: (event: { target: { checked: boolean } }) => {
              onUseOtherWallet(event.target.checked);
            },
          })}
        />
        Usar outra carteira?
      </label>

      <FieldShell
        label="Observação do colecionador (opcional)"
        error={errors.note?.message}
        className="mt-6 md:w-[calc(50%-12px)]"
      >
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            rows={6}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={describedBy}
            className={`${fieldControlClassName} h-38 resize-y py-3 md:h-38`}
            {...form.register("note")}
          />
        )}
      </FieldShell>
    </section>
  );
}
