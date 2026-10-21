import { Link } from "@tanstack/react-router";

import { CouponForm } from "@/features/cart/components/coupon-form";
import type { useCartQuote } from "@/shared/cart/use-cart-quote";
import { buttonVariants } from "@/shared/ui/button";
import { OrderTotals } from "@/shared/ui/order-totals";
import { CartSummarySkeleton } from "@/shared/ui/skeleton/cart-summary-skeleton";

type CartSummaryProps = {
  state: ReturnType<typeof useCartQuote>;
};

/** "Resumo da carteira": coupon, totals from the quote and the way to checkout. */
export function CartSummary({ state }: CartSummaryProps) {
  const { cart, quote, totals, estimating, blockingIssues } = state;

  if (!totals) {
    return quote.isError ? (
      <p role="alert" className="rounded-lg bg-surface p-6 text-sm text-danger">
        {quote.error.message}
      </p>
    ) : (
      <div aria-busy="true" aria-label="Calculando o resumo">
        <CartSummarySkeleton />
      </div>
    );
  }

  const blocked = blockingIssues.length > 0;

  return (
    <section
      aria-labelledby="cart-summary-title"
      className="flex flex-col gap-6 max-md:rounded-t-[32px] max-md:bg-surface max-md:p-6"
    >
      <h2
        id="cart-summary-title"
        className="border-b border-border pb-3 text-lg font-bold text-text max-md:sr-only"
      >
        Resumo da carteira
      </h2>
      <CouponForm cartVersion={cart.data?.version ?? 0} />
      <OrderTotals {...totals} estimating={estimating} />
      <p role="status" className="sr-only">
        {estimating ? "Atualizando os valores…" : `Total de ${totals.total} ETH`}
      </p>
      {blocked && (
        <p id="checkout-blocked" className="text-sm text-danger">
          Ajuste os itens sinalizados para continuar.
        </p>
      )}
      <div className="flex flex-col items-center gap-3">
        {blocked ? (
          <span
            role="link"
            aria-disabled="true"
            aria-describedby="checkout-blocked"
            className={buttonVariants({ className: "w-full opacity-50 md:h-10" })}
          >
            Conectar e finalizar
          </span>
        ) : (
          <Link
            to="/pagamento"
            className={buttonVariants({
              className:
                "w-full bg-linear-to-r from-primary-alt to-primary md:h-10 md:bg-primary md:bg-none",
            })}
          >
            Conectar e finalizar
          </Link>
        )}
        <Link to="/" hash="catalogo" className="text-[15px] text-primary-hi hover:underline">
          Continuar explorando
        </Link>
      </div>
    </section>
  );
}
