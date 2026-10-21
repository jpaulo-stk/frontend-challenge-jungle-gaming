import { useState } from "react";

import { useConnectWallet, useDisconnectWallet } from "@/features/checkout/api/checkout-api";
import type { Network, WalletProvider } from "@/shared/api/contracts/common";
import type { WalletConnection } from "@/shared/api/contracts/wallet";

type Target = { walletId: string | null; provider: WalletProvider | null; network: Network | null };

export type ConnectionStatus = "idle" | "connecting" | "connected" | "refused";

// A connection only counts for the wallet, provider and network it was made with
export function useWalletConnection(target: Target) {
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  const matches =
    connection !== null &&
    connection.walletId === target.walletId &&
    connection.provider === target.provider &&
    connection.network === target.network;

  const status: ConnectionStatus = connect.isPending
    ? "connecting"
    : matches
      ? "connected"
      : refusal
        ? "refused"
        : "idle";

  return {
    status,
    connection: matches ? connection : null,
    refusal,
    canConnect: target.walletId !== null && target.provider !== null && target.network !== null,
    connect: () => {
      const { walletId, provider, network } = target;
      if (!walletId || !provider || !network) return;
      setRefusal(null);
      connect.mutate(
        { walletId, provider, network },
        {
          onSuccess: setConnection,
          onError: (error) => {
            setConnection(null);
            setRefusal(error.message);
          },
        },
      );
    },
    disconnect: () => {
      if (connection) disconnect.mutate(connection.id);
      setConnection(null);
      setRefusal(null);
    },
  };
}

export type WalletConnectionState = ReturnType<typeof useWalletConnection>;
