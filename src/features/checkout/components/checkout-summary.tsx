import { Link } from "@tanstack/react-router";
import { cn } from "cn";

import type { CartItem, QuoteIssue } from "@/shared/api/contracts/cart";
import type { useCartQuote } from "@/shared/cart/use-cart-quote";
import { useCheckoutDraft } from "@/shared/checkout/checkout-draft";
import { formatEth } from "@/shared/lib/eth";
import { OrderTotals } from "@/shared/ui/order-totals";
import { CartSummarySkeleton } from "@/shared/ui/skeleton/cart-summary-skeleton";

type CheckoutSummaryProps = {
  state: ReturnType<typeof useCartQuote>;
  /** Locks the item toggles while an order is being sent. */
  locked: boolean;
};

function issueText(issue: QuoteIssue): string | null {
  if (issue.code === "EDITION_SOLD_OUT")
    return "Edição esgotada: deixe para depois ou remova no carrinho.";
  if (issue.code === "INSUFFICIENT_AVAILABILITY") {
    return `Restam ${String(issue.available)} unidades: ajuste a quantidade no carrinho.`;
  }
  return null;
}

/** "Seus NFTs": the lines of this purchase, what is left for later and the totals. */
export function CheckoutSummary({ state, locked }: CheckoutSummaryProps) {
  const { allItems, items, totals, estimating, quote, issuesOf } = state;
  const excluded = useCheckoutDraft((draft) => draft.excludedItemIds);
  const toggleExcluded = useCheckoutDraft((draft) => draft.toggleExcluded);
  const couponCode = useCheckoutDraft((draft) => draft.couponCode);

  return (
    <section aria-labelledby="checkout-items-title" className="flex flex-col gap-4">
      <h2 id="checkout-items-title" className="text-lg font-bold text-text">
        Seus NFTs
      </h2>
      <div
        aria-hidden="true"
        className="flex justify-between text-base font-bold text-text max-md:hidden"
      >
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="flex flex-col gap-3">
        {allItems.map((item) => (
          <SummaryLine
            key={item.id}
            item={item}
            issues={issuesOf(item.id)}
            excluded={excluded.includes(item.id)}
            locked={locked || (items.length === 1 && !excluded.includes(item.id))}
            onToggle={() => {
              toggleExcluded(item.id);
            }}
          />
        ))}
      </ul>

      <p className="text-center text-[15px] text-text">
        {couponCode ? (
          <>
            Cupom <strong className="text-primary-hi">{couponCode}</strong> aplicado.{" "}
            <Link to="/carrinho" className="text-primary-hi underline">
              Alterar no carrinho
            </Link>
          </>
        ) : (
          <>
            Tem um código promocional?{" "}
            <Link to="/carrinho" className="hover:text-primary-hi hover:underline">
              Aplique aqui
            </Link>
          </>
        )}
      </p>

      {totals ? (
        <OrderTotals {...totals} estimating={estimating} />
      ) : quote.isError ? (
        <p role="alert" className="text-sm text-danger">
          {quote.error.message}
        </p>
      ) : (
        <div aria-busy="true" aria-label="Calculando o resumo">
          <CartSummarySkeleton />
        </div>
      )}
    </section>
  );
}

type SummaryLineProps = {
  item: CartItem;
  issues: QuoteIssue[];
  excluded: boolean;
  locked: boolean;
  onToggle: () => void;
};

function SummaryLine({ item, issues, excluded, locked, onToggle }: SummaryLineProps) {
  const problems = issues.map(issueText).filter((text): text is string => text !== null);

  return (
    <li
      className={cn(
        "rounded-md bg-surface",
        problems.length > 0 && !excluded && "outline-[1.5px] outline-danger outline-solid",
      )}
    >
      {/* Narrow screens: quantity and subtotal go to a second line, so the name fits. */}
      <div
        className={cn(
          "grid grid-cols-[70px_minmax(0,1fr)_auto] items-center gap-x-3 p-1 pr-3 sm:grid-cols-[70px_minmax(0,1fr)_auto_auto]",
          excluded && "opacity-60",
        )}
      >
        <img
          src={item.image.src}
          alt={item.image.alt}
          width={70}
          height={70}
          className="row-span-2 size-17.5 rounded-md object-cover sm:row-span-1"
        />
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <p className="text-base font-bold text-text sm:truncate">{item.name}</p>
          <p className="truncate text-sm text-text-muted">ID do token: {item.tokenId}</p>
        </div>
        <span className="text-sm text-text-muted">
          <span className="sr-only">Quantidade: </span>(x {item.quantity})
        </span>
        <span className="text-right text-lg font-bold whitespace-nowrap text-primary-hi">
          {excluded ? <span className="sr-only">Fora desta compra: </span> : null}
          {formatEth(item.lineTotal)}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 text-sm">
        {problems.length > 0 && !excluded ? (
          <p className="text-danger">{problems.join(" ")}</p>
        ) : (
          <p className="text-text-muted">{excluded ? "Fica no carrinho para depois." : ""}</p>
        )}
        <button
          type="button"
          disabled={locked}
          aria-label={`${excluded ? "Incluir" : "Deixar para depois"}: ${item.name}`}
          onClick={onToggle}
          className="text-primary-hi underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {excluded ? "Incluir nesta compra" : "Deixar para depois"}
        </button>
      </div>
    </li>
  );
}
