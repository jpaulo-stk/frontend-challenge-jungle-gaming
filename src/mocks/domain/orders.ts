import { getConfig } from "@/mocks/config";
import { getDb, mutate } from "@/mocks/db/store";
import type { DbOrder, DbUser, OwnerKey } from "@/mocks/db/types";
import { changeNft } from "@/mocks/domain/nfts";
import { computeQuote, quoteStillValid } from "@/mocks/domain/quote";
import { artImage } from "@/mocks/fixtures/art";
import { apiError } from "@/mocks/handlers/http";
import { fakeTransactionHash, newId, stableStringify } from "@/mocks/lib/ids";
import { orderUpdatedEvent, publish } from "@/mocks/socket/bus";
import type { CreateOrderRequest, OrderStatus } from "@/shared/api/contracts/order";

const providerLabels = {
  metamask: "MetaMask",
  walletconnect: "WalletConnect",
  coinbase: "Coinbase Wallet",
};

export type CreateOrderResult = { order: DbOrder; created: boolean };

// Same key + same body returns the existing order; same key + another body is a 409
export function createOrder(
  user: DbUser,
  idempotencyKey: string,
  body: CreateOrderRequest,
): CreateOrderResult {
  const db = getDb();
  const requestHash = stableStringify(body);
  const previous = db.orders.find(
    (order) => order.userId === user.id && order.idempotencyKey === idempotencyKey,
  );
  if (previous) {
    if (previous.requestHash !== requestHash) {
      throw apiError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "Esta chave de idempotência já foi usada com outro pedido.",
      );
    }
    return { order: previous, created: false };
  }

  const owner: OwnerKey = `user:${user.id}`;
  const quote = db.quotes.find(
    (candidate) => candidate.id === body.quoteId && candidate.owner === owner,
  );
  if (!quote || Date.parse(quote.expiresAt) <= Date.now()) {
    throw apiError(
      409,
      "QUOTE_STALE",
      "A cotação expirou. Revise os valores e confirme novamente.",
    );
  }
  const fresh = computeQuote(owner, quote.couponCode, quote.itemIds);
  if (fresh.hasIssues) {
    throw apiError(409, "QUOTE_HAS_ISSUES", "Há itens indisponíveis no carrinho.");
  }
  if (!quoteStillValid(quote, fresh)) {
    throw apiError(
      409,
      "QUOTE_STALE",
      "Os valores do pedido mudaram. Revise e confirme novamente.",
    );
  }

  const wallet = db.wallets.find(
    (candidate) => candidate.id === body.walletId && candidate.userId === user.id,
  );
  const connection = db.connections.find(
    (candidate) => candidate.id === body.connectionId && candidate.userId === user.id,
  );
  if (!wallet || connection?.walletId !== wallet.id) {
    throw apiError(409, "WALLET_NOT_CONNECTED", "Conecte a carteira antes de confirmar a compra.");
  }

  const now = new Date().toISOString();
  const order: DbOrder = {
    id: newId("order"),
    userId: user.id,
    idempotencyKey,
    requestHash,
    status: "pending",
    version: 1,
    createdAt: now,
    updatedAt: now,
    network: connection.network,
    wallet: {
      provider: connection.provider,
      address: wallet.address,
      label: providerLabels[connection.provider],
    },
    lines: quote.lines.flatMap((line) => {
      const nft = db.nfts.find((candidate) => candidate.id === line.nftId);
      const edition = nft?.editions.find((candidate) => candidate.id === line.editionId);
      if (!nft || !edition) return [];
      return {
        nftId: nft.id,
        name: nft.name,
        tokenId: nft.tokenId,
        image: artImage(nft.art, nft.name),
        editionId: edition.id,
        editionLabel: edition.label,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      };
    }),
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
    coupon:
      quote.couponCode && quote.percentOff
        ? { code: quote.couponCode, percentOff: quote.percentOff }
        : null,
    transactionHash: null,
    explorerUrl: null,
    rejectionReason: null,
    buyer: body.buyer,
    settleAt: getConfig().settle === "auto" ? Date.now() + getConfig().settleDelayMs : null,
  };

  mutate((state) => {
    state.orders.push(order);
    state.quotes = state.quotes.filter((candidate) => candidate.id !== quote.id);
  });
  scheduleSettlement(order);
  return { order, created: true };
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleSettlement(order: DbOrder): void {
  if (order.status !== "pending" || order.settleAt === null || timers.has(order.id)) return;
  const wait = Math.max(0, order.settleAt - Date.now());
  timers.set(
    order.id,
    setTimeout(() => {
      timers.delete(order.id);
      void settleOrder(
        order.id,
        getConfig().scenario === "payment-rejected" ? "rejected" : "confirmed",
      );
    }, wait),
  );
}

export function resumePendingOrders(): void {
  for (const order of getDb().orders) scheduleSettlement(order);
}

export function cancelSettlements(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}

// Confirmation removes exactly the purchased quantities from the cart
export async function settleOrder(
  orderId: string,
  outcome: Exclude<OrderStatus, "pending">,
): Promise<DbOrder | null> {
  const order = getDb().orders.find((candidate) => candidate.id === orderId);
  if (order?.status !== "pending") return order ?? null;

  const db = getDb();
  const shortage = order.lines.find((line) => {
    const edition = db.nfts
      .find((nft) => nft.id === line.nftId)
      ?.editions.find((e) => e.id === line.editionId);
    return !edition || edition.available < line.quantity;
  });
  const status: Exclude<OrderStatus, "pending"> =
    outcome === "confirmed" && shortage ? "rejected" : outcome;
  const transactionHash = status === "confirmed" ? await fakeTransactionHash(order.id) : null;

  if (status === "confirmed") {
    for (const line of order.lines) {
      const nft = getDb().nfts.find((candidate) => candidate.id === line.nftId);
      const edition = nft?.editions.find((candidate) => candidate.id === line.editionId);
      if (nft && edition)
        changeNft(nft.id, { editions: { [edition.id]: edition.available - line.quantity } });
    }
  }

  const settled = mutate((state) => {
    const stored = state.orders.find((candidate) => candidate.id === order.id);
    if (stored?.status !== "pending") return null;
    stored.status = status;
    stored.version += 1;
    stored.updatedAt = new Date().toISOString();
    stored.settleAt = null;
    stored.transactionHash = transactionHash;
    stored.explorerUrl = transactionHash ? `https://etherscan.io/tx/${transactionHash}` : null;
    stored.rejectionReason =
      status === "rejected"
        ? shortage
          ? "Uma das edições esgotou antes da confirmação."
          : "O pagamento foi recusado pela carteira."
        : null;

    if (status === "confirmed") {
      const owner: OwnerKey = `user:${stored.userId}`;
      for (const line of stored.lines) {
        const item = state.cartItems.find(
          (candidate) =>
            candidate.owner === owner &&
            candidate.nftId === line.nftId &&
            candidate.editionId === line.editionId,
        );
        if (item) item.quantity -= line.quantity;
      }
      state.cartItems = state.cartItems.filter((item) => item.quantity > 0);
      state.cartVersions[owner] = (state.cartVersions[owner] ?? 0) + 1;
    }
    return structuredClone(stored);
  });

  if (settled) publish(orderUpdatedEvent(settled));
  return settled;
}
