import { useState } from "react";

import { describeQuoteChanges } from "@/features/checkout/lib/quote-changes";
import type { CartItem, Quote } from "@/shared/api/contracts/cart";

type Options = {
  /** The quote on screen (refreshed by realtime events while checkout is open). */
  quote: Quote | undefined;
  /** False while `quote` is still the previous request's (placeholder or refetch). */
  settled: boolean;
  /** Identity of the request (coupon, items, cart version): changes when the collector acts. */
  requestKey: string;
  items: CartItem[];
};

/**
 * The quote the collector has seen and accepted. A new quote caused by the
 * collector (coupon, items left for later) is accepted as it arrives; one that
 * changed underneath (a price or availability event) is not: the differences
 * are listed and the purchase only goes on after an explicit confirmation.
 */
export function useAcknowledgedQuote({ quote, settled, requestKey, items }: Options) {
  const [acknowledged, setAcknowledged] = useState<{ key: string; quote: Quote } | null>(null);

  if (quote && settled && acknowledged?.key !== requestKey) {
    setAcknowledged({ key: requestKey, quote });
  }

  const seen = acknowledged?.key === requestKey ? acknowledged.quote : quote;
  const changes = seen && quote ? describeQuoteChanges(seen, quote, items) : [];

  return {
    /** What the collector saw: the reference for the revalidation before sending. */
    seen,
    /** What changed since then, without any action of the collector. */
    changes,
    accept: (next: Quote) => {
      setAcknowledged({ key: requestKey, quote: next });
    },
  };
}
