import Big from "big.js";

import { getConfig } from "@/mocks/config";
import { getDb, mutate } from "@/mocks/db/store";
import type { DbQuote, OwnerKey } from "@/mocks/db/types";
import { apiError } from "@/mocks/handlers/http";
import { newId } from "@/mocks/lib/ids";
import type { Quote, QuoteIssue, QuoteLine } from "@/shared/api/contracts/cart";

export const NETWORK_FEE = "0.016";
const QUOTE_TTL_MS = 10 * 60 * 1000;

type CouponResult = { code: string; percentOff: number } | null;

function validateCoupon(rawCode: string | null): CouponResult {
  if (rawCode === null) return null;
  const code = rawCode.trim().toUpperCase();
  const db = getDb();
  const coupon = db.coupons.find((candidate) => candidate.code === code);

  if (!coupon) {
    throw apiError(422, "COUPON_INVALID", "Cupom inválido.", { couponCode: "Cupom inválido." });
  }
  if (
    coupon.expired ||
    (db.flags.couponExpiresOnNextUse && getConfig().scenario === "coupon-expired")
  ) {
    mutate((state) => {
      const stored = state.coupons.find((candidate) => candidate.code === code);
      if (stored) stored.expired = true;
    });
    throw apiError(422, "COUPON_EXPIRED", "Este cupom expirou.", {
      couponCode: "Este cupom expirou.",
    });
  }
  // coupon-expired: the first use succeeds, the next validation (checkout) fails.
  if (getConfig().scenario === "coupon-expired") {
    mutate((state) => {
      state.flags.couponExpiresOnNextUse = true;
    });
  }
  return { code: coupon.code, percentOff: coupon.percentOff };
}

type Computed = Omit<DbQuote, "id" | "owner" | "itemIds" | "createdAt" | "expiresAt"> & {
  issues: QuoteIssue[];
};

export function computeQuote(
  owner: OwnerKey,
  couponCode: string | null,
  itemIds: string[] | null = null,
): Computed {
  const db = getDb();
  const items = db.cartItems.filter(
    (item) => item.owner === owner && (itemIds === null || itemIds.includes(item.id)),
  );
  if (items.length === 0) {
    throw apiError(422, "CART_EMPTY", "Seu carrinho está vazio.");
  }

  const lines: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];
  for (const item of items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId);
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId);
    if (!nft || !edition) continue;

    lines.push({
      itemId: item.id,
      nftId: nft.id,
      editionId: edition.id,
      quantity: item.quantity,
      unitPrice: nft.price,
      lineTotal: new Big(nft.price).times(item.quantity).toFixed(),
    });

    if (!new Big(nft.price).eq(item.addedUnitPrice)) {
      issues.push({
        code: "PRICE_CHANGED",
        itemId: item.id,
        nftId: nft.id,
        previousPrice: item.addedUnitPrice,
        currentPrice: nft.price,
      });
    }
    if (edition.available === 0) {
      issues.push({ code: "EDITION_SOLD_OUT", itemId: item.id, nftId: nft.id });
    } else if (item.quantity > edition.available) {
      issues.push({
        code: "INSUFFICIENT_AVAILABILITY",
        itemId: item.id,
        nftId: nft.id,
        requested: item.quantity,
        available: edition.available,
      });
    }
  }

  const coupon = validateCoupon(couponCode);
  const subtotal = lines.reduce((sum, line) => sum.plus(line.lineTotal), new Big(0));
  const discount = coupon
    ? subtotal.times(coupon.percentOff).div(100).round(3, Big.roundHalfUp)
    : new Big(0);
  const total = subtotal.minus(discount).plus(NETWORK_FEE);

  return {
    couponCode: coupon?.code ?? null,
    percentOff: coupon?.percentOff ?? null,
    lines,
    subtotal: subtotal.toFixed(),
    discount: discount.toFixed(),
    networkFee: NETWORK_FEE,
    total: total.toFixed(),
    // A price change is informative once quoted; only availability blocks checkout.
    hasIssues: issues.some((issue) => issue.code !== "PRICE_CHANGED"),
    issues,
  };
}

export function createQuote(
  owner: OwnerKey,
  couponCode: string | null,
  itemIds: string[] | null = null,
): Quote {
  const computed = computeQuote(owner, couponCode, itemIds);
  const now = Date.now();
  const quote: DbQuote = {
    id: newId("quote"),
    owner,
    itemIds,
    couponCode: computed.couponCode,
    percentOff: computed.percentOff,
    lines: computed.lines,
    subtotal: computed.subtotal,
    discount: computed.discount,
    networkFee: computed.networkFee,
    total: computed.total,
    hasIssues: computed.hasIssues,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  };
  mutate((db) => {
    db.quotes = [...db.quotes.filter((stored) => stored.owner !== owner), quote];
  });
  return {
    quoteId: quote.id,
    lines: quote.lines,
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
    coupon:
      quote.couponCode && quote.percentOff
        ? { code: quote.couponCode, percentOff: quote.percentOff }
        : null,
    expiresAt: quote.expiresAt,
    issues: computed.issues,
  };
}

export function quoteStillValid(stored: DbQuote, fresh: Computed): boolean {
  const key = (lines: QuoteLine[]) =>
    lines
      .map((line) => `${line.itemId}:${line.editionId}:${String(line.quantity)}:${line.unitPrice}`)
      .join("|");
  return (
    key(stored.lines) === key(fresh.lines) &&
    stored.couponCode === fresh.couponCode &&
    stored.total === fresh.total
  );
}
