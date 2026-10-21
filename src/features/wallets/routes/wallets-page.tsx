import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { WalletForm } from "@/features/wallets/components/wallet-form";
import { emptyWallet, walletToForm } from "@/features/wallets/components/wallet-form-values";
import type { Wallet } from "@/shared/api/contracts/wallet";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { walletsQueryOptions } from "@/shared/wallets/wallets-api";

export function WalletsPage() {
  const wallets = useQuery(walletsQueryOptions);

  if (wallets.isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando carteiras" className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-19.5" />
        ))}
      </div>
    );
  }

  if (wallets.isError) {
    return (
      <ErrorState
        message={wallets.error.message}
        onRetry={() => void wallets.refetch()}
        retrying={wallets.isFetching}
      />
    );
  }

  const { primary, secondary } = wallets.data;

  return (
    <div>
      <section aria-labelledby="primary-wallet-title">
        <h1 id="primary-wallet-title" className="text-lg font-bold text-text">
          Carteira principal
        </h1>
        <p className="mt-1 mb-8 text-sm text-text-muted">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
        <WalletForm
          role="primary"
          existing={primary}
          defaults={primary ? walletToForm(primary) : emptyWallet}
        />
      </section>

      <SecondaryWallet primary={primary} secondary={secondary} />
    </div>
  );
}

type SecondaryWalletProps = {
  primary: Wallet | null;
  secondary: Wallet | null;
};

function SecondaryWallet({ primary, secondary }: SecondaryWalletProps) {
  const [adding, setAdding] = useState(false);
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  const sameId = useId();

  const defaults = secondary
    ? walletToForm(secondary)
    : sameAsPrimary && primary
      ? { ...walletToForm(primary), nickname: "" }
      : emptyWallet;

  return (
    <section aria-labelledby="secondary-wallet-title" className="mt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="secondary-wallet-title" className="text-lg font-bold text-text">
            Carteira secundária
          </h2>
          {!secondary && !adding && (
            <p className="mt-1 text-sm text-text-muted">
              Você ainda não adicionou uma carteira secundária.
            </p>
          )}
        </div>
        {!secondary && !adding && (
          <div className="flex items-center gap-4">
            <label
              htmlFor={sameId}
              className="flex cursor-pointer items-center gap-2 text-sm text-text"
            >
              <input
                id={sameId}
                type="checkbox"
                checked={sameAsPrimary}
                disabled={!primary}
                onChange={(event) => {
                  setSameAsPrimary(event.target.checked);
                }}
                className="size-4 appearance-none rounded-full border-[1.5px] border-primary checked:border-5 disabled:opacity-40"
              />
              Igual à carteira principal
            </label>
            <button
              type="button"
              className="text-[15px] font-bold text-primary-hi hover:underline"
              onClick={() => {
                setAdding(true);
              }}
            >
              Adicionar
            </button>
          </div>
        )}
      </div>

      {(secondary ?? adding) && (
        <div className="mt-6">
          <WalletForm role="secondary" existing={secondary} defaults={defaults} />
        </div>
      )}
    </section>
  );
}
