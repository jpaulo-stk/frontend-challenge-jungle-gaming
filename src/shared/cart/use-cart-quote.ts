import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import type { CartItem, QuoteIssue } from "@/shared/api/contracts/cart";
import { cartQueryOptions } from "@/shared/cart/cart-api";
import { quoteQueryOptions } from "@/shared/cart/quote-api";
import { useCheckoutDraft } from "@/shared/checkout/checkout-draft";
import { addEth, subEth, sumEth } from "@/shared/lib/eth";
import { useNftSubscription } from "@/shared/realtime/use-realtime";

const couponErrors = new Set(["COUPON_EXPIRED", "COUPON_INVALID"]);
const blockingCodes = new Set<QuoteIssue["code"]>([
  "EDITION_SOLD_OUT",
  "INSUFFICIENT_AVAILABILITY",
]);

type Options = {
  excludedItemIds?: readonly string[];
};

// While a new quote loads, totals are estimated locally (big.js)
export function useCartQuote({ excludedItemIds = [] }: Options = {}) {
  const cart = useQuery(cartQueryOptions);
  const couponCode = useCheckoutDraft((draft) => draft.couponCode);
  const setCoupon = useCheckoutDraft((draft) => draft.setCoupon);

  const allItems: CartItem[] = cart.data?.items ?? [];
  useNftSubscription(allItems.map((item) => item.nftId));
  const items = allItems.filter((item) => !excludedItemIds.includes(item.id));
  // The whole cart is quoted without itemIds, sharing the cart page's quote.
  const itemIds = items.length < allItems.length ? items.map((item) => item.id) : undefined;
  const quote = useQuery({
    ...quoteQueryOptions({
      couponCode,
      ...(itemIds ? { itemIds } : {}),
      cartVersion: cart.data?.version ?? 0,
    }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
  });

  const couponError = quote.error && couponErrors.has(quote.error.code) ? quote.error : null;
  useEffect(() => {
    if (!couponError) return;
    setCoupon(null);
    toast.warning(`${couponError.message} O total foi recalculado sem o cupom.`);
  }, [couponError, setCoupon]);

  const issues = quote.data?.issues ?? [];
  const issuesOf = (itemId: string) => issues.filter((issue) => issue.itemId === itemId);
  const blockingIssues = issues.filter((issue) => blockingCodes.has(issue.code));

  const estimating =
    quote.isPlaceholderData || (quote.isFetching && !quote.isPending) || cart.isFetching;
  const localSubtotal = sumEth(items.map((item) => item.lineTotal));
  const totals = quote.data
    ? estimating
      ? {
          subtotal: localSubtotal,
          discount: quote.data.discount,
          networkFee: quote.data.networkFee,
          total: addEth(subEth(localSubtotal, quote.data.discount), quote.data.networkFee),
        }
      : quote.data
    : null;

  return { cart, quote, allItems, items, itemIds, totals, estimating, issuesOf, blockingIssues };
}
