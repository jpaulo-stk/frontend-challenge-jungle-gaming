import { http, HttpResponse } from "msw";

import { getConfig } from "@/mocks/config";
import { getDb, mutate } from "@/mocks/db/store";
import type { DbWallet } from "@/mocks/db/types";
import { toWallet } from "@/mocks/domain/serialize";
import { API, apiError, readBody, requireUser } from "@/mocks/handlers/http";
import { newId } from "@/mocks/lib/ids";
import {
  createWalletRequestSchema,
  walletConnectionRequestSchema,
  walletInputSchema,
} from "@/shared/api/contracts/wallet";

function walletsOf(userId: string) {
  const wallets = getDb().wallets.filter((wallet) => wallet.userId === userId);
  const pick = (role: DbWallet["role"]) => {
    const wallet = wallets.find((candidate) => candidate.role === role);
    return wallet ? toWallet(wallet) : null;
  };
  return { primary: pick("primary"), secondary: pick("secondary") };
}

export const walletHandlers = [
  http.get(`${API}/wallets`, ({ request }) => {
    const { user } = requireUser(request);
    return HttpResponse.json(walletsOf(user.id));
  }),

  http.post(`${API}/wallets`, async ({ request }) => {
    const { user } = requireUser(request);
    const input = await readBody(request, createWalletRequestSchema);
    if (getDb().wallets.some((wallet) => wallet.userId === user.id && wallet.role === input.role)) {
      return apiError(
        409,
        "WALLET_EXISTS",
        "Esta carteira já está cadastrada; edite-a em vez de criar outra.",
      );
    }
    const wallet: DbWallet = { ...input, id: newId("wallet"), userId: user.id, version: 1 };
    mutate((db) => {
      db.wallets.push(wallet);
    });
    return HttpResponse.json(toWallet(wallet), { status: 201 });
  }),

  http.patch(`${API}/wallets/:id`, async ({ request, params }) => {
    const { user } = requireUser(request);
    const input = await readBody(request, walletInputSchema.partial());
    const updated = mutate((db) => {
      const stored = db.wallets.find(
        (wallet) => wallet.id === params.id && wallet.userId === user.id,
      );
      if (!stored) return null;
      Object.assign(stored, input);
      stored.version += 1;
      return stored;
    });
    return updated
      ? HttpResponse.json(toWallet(updated))
      : apiError(404, "WALLET_NOT_FOUND", "Carteira não encontrada.");
  }),

  // Simulated provider handshake (MetaMask / WalletConnect / Coinbase).
  http.post(`${API}/wallet-connections`, async ({ request }) => {
    const { user } = requireUser(request);
    const input = await readBody(request, walletConnectionRequestSchema);
    const wallet = getDb().wallets.find(
      (candidate) => candidate.id === input.walletId && candidate.userId === user.id,
    );
    if (!wallet) return apiError(404, "WALLET_NOT_FOUND", "Carteira não encontrada.");
    if (getConfig().scenario === "wallet-rejected") {
      return apiError(409, "WALLET_REJECTED", "A conexão foi recusada na carteira.");
    }
    const connection = { id: newId("conn"), userId: user.id, ...input };
    mutate((db) => {
      db.connections = [
        ...db.connections.filter((candidate) => candidate.userId !== user.id),
        connection,
      ];
    });
    return HttpResponse.json(
      {
        id: connection.id,
        walletId: wallet.id,
        provider: input.provider,
        network: input.network,
        status: "connected",
      },
      { status: 201 },
    );
  }),

  http.delete(`${API}/wallet-connections/:id`, ({ request, params }) => {
    const { user } = requireUser(request);
    mutate((db) => {
      db.connections = db.connections.filter((c) => !(c.id === params.id && c.userId === user.id));
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
