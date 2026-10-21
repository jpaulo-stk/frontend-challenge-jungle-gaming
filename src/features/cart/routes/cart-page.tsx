import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ShoppingCart } from "lucide-react";

import { CartItemRow } from "@/features/cart/components/cart-item-row";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { useCartQuote } from "@/shared/cart/use-cart-quote";
import { buttonVariants } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { TableRowsSkeleton } from "@/shared/ui/skeleton/table-rows-skeleton";

export function CartPage() {
  const router = useRouter();
  const state = useCartQuote();
  const { cart, items, issuesOf } = state;

  return (
    <div className="page-container pt-6 pb-10 lg:pt-10">
      <nav
        aria-label="Trilha de navegação"
        className="hidden text-[15px] font-bold text-text md:block"
      >
        <Link to="/" className="hover:text-primary-hi">
          Início
        </Link>{" "}
        /{" "}
        <Link to="/" hash="catalogo" className="hover:text-primary-hi">
          Mercado
        </Link>{" "}
        / Carrinho
      </nav>
      <div className="relative flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={() => {
            router.history.back();
          }}
          className="absolute left-0 inline-flex size-9 items-center justify-center rounded-full bg-surface-2"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          <span className="sr-only">Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-text">Carrinho de NFTs</h1>
      </div>
      <h1 className="sr-only max-md:hidden">Carrinho de NFTs</h1>

      {cart.isPending && (
        <div aria-busy="true" aria-label="Carregando carrinho" className="mt-6">
          <TableRowsSkeleton />
        </div>
      )}

      {cart.isError && (
        <ErrorState
          className="mt-6"
          message={cart.error.message}
          onRetry={() => void cart.refetch()}
          retrying={cart.isFetching}
        />
      )}

      {cart.data && items.length === 0 && (
        <EmptyState
          className="mt-6"
          icon={<ShoppingCart />}
          title="Seu carrinho está vazio"
          description="Explore o catálogo e adicione os NFTs que quiser colecionar."
          action={
            <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
              Explorar NFTs
            </Link>
          }
        />
      )}

      {items.length > 0 && (
        <div className="mt-4 grid gap-8 lg:grid-cols-[782px_1fr] lg:gap-21.5">
          <section aria-label="Itens do carrinho">
            <div
              aria-hidden="true"
              className="grid grid-cols-[56px_minmax(0,1fr)_120px_130px_110px_40px] gap-x-4 border-b border-border px-1 pb-3 text-base font-bold text-text max-md:hidden"
            >
              <span className="col-span-2">NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            <ul className="mt-3 flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} issues={issuesOf(item.id)} />
              ))}
            </ul>
          </section>
          <CartSummary state={state} />
        </div>
      )}
    </div>
  );
}
