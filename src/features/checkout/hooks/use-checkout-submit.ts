import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { useCreateOrder } from "@/features/checkout/api/checkout-api";
import { describeQuoteChanges } from "@/features/checkout/lib/quote-changes";
import type { CartItem, Quote } from "@/shared/api/contracts/cart";
import type { CreateOrderRequest } from "@/shared/api/contracts/order";
import { orderKeys } from "@/shared/api/query-keys";
import { AppError } from "@/shared/api/errors";
import { quoteQueryOptions } from "@/shared/cart/quote-api";
import { useCheckoutDraft, type OrderAttempt } from "@/shared/checkout/checkout-draft";

export type OrderBody = Omit<CreateOrderRequest, "quoteId">;
/** What changed since the collector last saw the values; sending waits for a new "yes". */
export type Review = { quote: Quote; changes: string[]; blocked: boolean; body: OrderBody };
export type SendProblem = { kind: "unanswered" | "failed"; message: string };

type Options = {
  items: CartItem[];
  itemIds: string[] | undefined;
  cartVersion: number;
};

const unanswered = new Set(["TIMEOUT", "NETWORK_ERROR", "SERVER_ERROR"]);
const needsRequote = new Set([
  "QUOTE_STALE",
  "QUOTE_HAS_ISSUES",
  "COUPON_EXPIRED",
  "COUPON_INVALID",
]);
const blockingCodes = new Set(["EDITION_SOLD_OUT", "INSUFFICIENT_AVAILABILITY"]);
const outdated = "Os valores mudaram desde o envio. Revise o resumo e confirme novamente.";
/** Why the API asked for a new quote (expired, values changed, coupon fell). */
type Requote = { requote: string };

/**
 * Review and submission of the purchase. Every confirmation asks the quote
 * again; if anything differs from what the collector saw, nothing is sent and
 * the differences need an explicit new confirmation. Each attempt keeps its
 * Idempotency-Key in the draft, so a resend after a timeout or a refresh
 * recovers the same order. A synchronous lock covers the whole sequence, so
 * repeated clicks never start a second attempt.
 */
export function useCheckoutSubmit({ items, itemIds, cartVersion }: Options) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const draft = useCheckoutDraft();
  const lock = useRef(false);
  // Set once an order exists: nothing else is sent from this page.
  const sent = useRef(false);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [problem, setProblem] = useState<SendProblem | null>(null);

  const freshQuote = async (couponCode: string | null): Promise<Quote> => {
    try {
      return await queryClient.query({
        ...quoteQueryOptions({ couponCode, ...(itemIds ? { itemIds } : {}), cartVersion }),
        staleTime: 0,
      });
    } catch (error) {
      // The coupon fell at checkout: price again without it (the change is listed).
      if (couponCode && error instanceof AppError && error.code.startsWith("COUPON_")) {
        draft.setCoupon(null);
        return freshQuote(null);
      }
      throw error;
    }
  };

  const run = async (task: () => Promise<void>) => {
    if (lock.current || sent.current) return;
    lock.current = true;
    setBusy(true);
    setProblem(null);
    try {
      await task();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const send = async (attempt: OrderAttempt): Promise<"sent" | Requote> => {
    draft.setAttempt(attempt);
    try {
      const order = await createOrder.mutateAsync(attempt);
      sent.current = true;
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      draft.setPendingOrder(order.id);
      draft.setAttempt(null);
      setReview(null);
      void navigate({ to: "/pedido/$orderId", params: { orderId: order.id }, replace: true });
      return "sent";
    } catch (error) {
      const appError = error instanceof AppError ? error : null;
      setReview(null);
      if (appError && unanswered.has(appError.code)) {
        // The order may exist: keep the attempt so a resend recovers it.
        setProblem({
          kind: "unanswered",
          message:
            "Não recebemos a resposta do envio. Tentar novamente reenvia a mesma solicitação e não cria outra compra.",
        });
        return "sent";
      }
      draft.setAttempt(null);
      if (appError && needsRequote.has(appError.code)) return { requote: appError.message };
      setProblem({ kind: "failed", message: appError?.message ?? String(error) });
      return "sent";
    }
  };

  /** Re-prices, compares with `seen` and sends only when nothing changed. */
  const check = async (seen: Quote, body: OrderBody, retried = false): Promise<void> => {
    const fresh = await freshQuote(draft.couponCode);
    const changes = describeQuoteChanges(seen, fresh, items);
    const blocked = fresh.issues.some((issue) => blockingCodes.has(issue.code));
    if (changes.length > 0 || blocked) {
      setReview({ quote: fresh, changes, blocked, body });
      return;
    }
    const full: CreateOrderRequest = { ...body, quoteId: fresh.quoteId };
    const outcome = await send({ key: crypto.randomUUID(), body: full });
    // The API found the values outdated between our check and the send.
    if (outcome === "sent") return;
    if (!retried) {
      await check(seen, body, true);
      return;
    }
    setProblem({ kind: "failed", message: outdated });
  };

  const guarded = (task: () => Promise<void>) =>
    run(async () => {
      try {
        await task();
      } catch (error) {
        setProblem({
          kind: "failed",
          message: error instanceof AppError ? error.message : String(error),
        });
      }
    });

  return {
    review,
    problem,
    busy,
    pendingAttempt: draft.attempt,
    /** "Confirmar compra": validated form body plus the quote on screen. */
    confirm: (seen: Quote, body: OrderBody) => guarded(() => check(seen, body)),
    /** "Confirmar com os novos valores": the reviewed quote becomes what was seen. */
    acceptReview: () => {
      if (!review) return;
      const { quote, body } = review;
      void guarded(() => check(quote, body));
    },
    /** Resends the last unanswered attempt, unchanged (same key, same body). */
    resend: () => {
      const attempt = draft.attempt;
      if (!attempt) return;
      void guarded(async () => {
        const outcome = await send(attempt);
        if (outcome !== "sent")
          setProblem({ kind: "failed", message: outcome.requote || outdated });
      });
    },
    closeReview: () => {
      setReview(null);
    },
  };
}

export type CheckoutSubmit = ReturnType<typeof useCheckoutSubmit>;
