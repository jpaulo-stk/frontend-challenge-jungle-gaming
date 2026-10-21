import { useState } from "react";

import { describeQuoteChanges } from "@/features/checkout/lib/quote-changes";
import type { CartItem, Quote } from "@/shared/api/contracts/cart";

type Options = {
  quote: Quote | undefined;
  /** False while the data is still a placeholder or refetch */
  settled: boolean;
  requestKey: string;
  items: CartItem[];
};

// The quote the user accepted: changes caused by events need an explicit confirmation
export function useAcknowledgedQuote({ quote, settled, requestKey, items }: Options) {
  const [acknowledged, setAcknowledged] = useState<{ key: string; quote: Quote } | null>(null);

  if (quote && settled && acknowledged?.key !== requestKey) {
    setAcknowledged({ key: requestKey, quote });
  }

  const seen = acknowledged?.key === requestKey ? acknowledged.quote : quote;
  const changes = seen && quote ? describeQuoteChanges(seen, quote, items) : [];

  return {
    seen,
    changes,
    accept: (next: Quote) => {
      setAcknowledged({ key: requestKey, quote: next });
    },
  };
}
