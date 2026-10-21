import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { CircleCheck, LoaderCircle, Wallet as WalletIcon } from "lucide-react";

import type { WalletConnectionState } from "@/features/checkout/hooks/use-wallet-connection";
import type { WalletProvider } from "@/shared/api/contracts/common";
import type { Wallet, WalletsResponse } from "@/shared/api/contracts/wallet";
import { Button } from "@/shared/ui/button";

const providers: { value: WalletProvider; label: string; mark: string }[] = [
  { value: "walletconnect", label: "WalletConnect", mark: "W" },
  { value: "metamask", label: "MetaMask", mark: "M" },
  { value: "coinbase", label: "Coinbase Wallet", mark: "C" },
];

const networkNames = { ethereum: "Ethereum", polygon: "Polygon", solana: "Solana" } as const;
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const option =
  "flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-transparent bg-surface px-4 py-4 has-[:checked]:border-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring md:rounded-md md:border-border";

type WalletSelectorProps = {
  wallets: WalletsResponse;
  walletId: string | null;
  onWalletChange: (wallet: Wallet) => void;
  provider: WalletProvider | null;
  onProviderChange: (provider: WalletProvider) => void;
  connection: WalletConnectionState;
};

/** Registered wallet to pay with, the provider to connect through and the connection state. */
export function WalletSelector(props: WalletSelectorProps) {
  const { wallets, walletId, onWalletChange, provider, onProviderChange, connection } = props;
  const registered = [wallets.primary, wallets.secondary].filter(
    (wallet): wallet is Wallet => wallet !== null,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* The floated legend lays out as a normal block, beside "Trocar carteira". */}
      <fieldset className="flow-root">
        <legend className="float-left mb-3 text-[15px] font-bold text-text">
          Carteira cadastrada
        </legend>
        {registered.length > 0 && (
          // "Trocar carteira" of the mobile frame: the wallets are managed in the profile.
          <Link
            to="/perfil/carteiras"
            className="float-right text-[15px] font-bold text-primary-hi hover:underline"
          >
            Trocar carteira
          </Link>
        )}
        {registered.length === 0 ? (
          <p className="clear-both text-sm text-text-muted">
            Você ainda não tem carteiras.{" "}
            <Link to="/perfil/carteiras" className="text-primary-hi underline">
              Cadastrar carteira
            </Link>
          </p>
        ) : (
          <div className="clear-both flex flex-col gap-3">
            {registered.map((wallet) => (
              <label key={wallet.id} className={option}>
                <input
                  type="radio"
                  name="wallet"
                  className="size-4 shrink-0 appearance-none rounded-full border-[1.5px] border-primary checked:border-5"
                  checked={walletId === wallet.id}
                  onChange={() => {
                    onWalletChange(wallet);
                  }}
                />
                <span className="flex flex-col text-sm">
                  <span className="text-base font-bold text-text">{wallet.nickname}</span>
                  <span className="text-text-muted">
                    {wallet.alternateAddress ?? short(wallet.address)}
                  </span>
                  <span className="text-text-muted">
                    {wallet.role === "primary" ? "Rede principal " : "Rede "}
                    {networkNames[wallet.network]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-center text-lg font-bold text-text max-md:text-left">
          Carteira e rede
        </legend>
        <div className="flex flex-col gap-3">
          {providers.map((item) => (
            <label key={item.value} className={option}>
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-surface-2 font-bold text-primary-hi md:hidden"
              >
                {item.mark}
              </span>
              <span className="flex-1 text-[15px] text-text">{item.label}</span>
              <input
                type="radio"
                name="provider"
                className="size-4 shrink-0 appearance-none rounded-full border-[1.5px] border-primary checked:border-5 md:order-first"
                checked={provider === item.value}
                onChange={() => {
                  onProviderChange(item.value);
                }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="flex flex-wrap items-center gap-3 text-sm">
        {connection.status === "connected" && (
          <>
            <span className="flex items-center gap-2 text-success">
              <CircleCheck aria-hidden="true" className="size-5" /> Carteira conectada
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="font-normal"
              onClick={connection.disconnect}
            >
              Desconectar
            </Button>
          </>
        )}
        {connection.status !== "connected" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10"
            disabled={!connection.canConnect || connection.status === "connecting"}
            onClick={connection.connect}
          >
            {connection.status === "connecting" ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <WalletIcon aria-hidden="true" />
            )}
            {connection.status === "connecting" ? "Conectando…" : "Conectar carteira"}
          </Button>
        )}
      </div>
      {connection.status === "refused" && (
        <p role="alert" className={cn("text-sm text-danger")}>
          {connection.refusal} Tente novamente ou escolha outro provedor.
        </p>
      )}
    </div>
  );
}
