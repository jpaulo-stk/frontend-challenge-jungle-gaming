import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { TriangleAlert, Trash2 } from "lucide-react";

import { useRemoveCartItem, useUpdateCartItem } from "@/features/cart/api/cart-mutations";
import type { CartItem, QuoteIssue } from "@/shared/api/contracts/cart";
import { formatEth } from "@/shared/lib/eth";
import { QuantityStepper } from "@/shared/ui/quantity-stepper";

type CartItemRowProps = {
  item: CartItem;
  issues: QuoteIssue[];
};

/** One cart line: table row on desktop, card on mobile. */
export function CartItemRow({ item, issues }: CartItemRowProps) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const soldOut = issues.some((issue) => issue.code === "EDITION_SOLD_OUT");
  const priceChange = issues.find((issue) => issue.code === "PRICE_CHANGED");
  const shortage = issues.find((issue) => issue.code === "INSUFFICIENT_AVAILABILITY");

  const setQuantity = (quantity: number) => {
    update.mutate({ itemId: item.id, quantity });
  };

  return (
    <li
      className={cn(
        "rounded-lg bg-surface md:rounded-none",
        (soldOut || shortage) && "outline-[1.5px] outline-danger outline-solid",
      )}
    >
      <div className="grid grid-cols-[76px_1fr_auto] items-center gap-x-3 p-0 md:min-h-[70px] md:grid-cols-[56px_minmax(0,1fr)_120px_130px_110px_40px] md:gap-x-4 md:px-1">
        <img
          src={item.image.src}
          alt={item.image.alt}
          width={76}
          height={76}
          className="row-span-2 size-[96px] rounded-l-lg object-cover md:row-span-1 md:size-14 md:rounded-md"
        />
        <div className="min-w-0 py-3 md:py-0">
          <Link
            to="/nft/$nftId"
            params={{ nftId: item.nftId }}
            className="block truncate text-[15px] font-bold text-text hover:text-primary-hi md:text-base"
          >
            {item.name}
          </Link>
          <p className="text-[13px] text-text-muted md:text-sm">
            <span className="md:hidden">Edição: {item.editionLabel}</span>
            <span className="max-md:hidden">ID do token: {item.tokenId}</span>
          </p>
          <p className="mt-1 text-lg font-bold text-primary-hi md:hidden">
            {formatEth(item.lineTotal)}
          </p>
        </div>
        <p className="text-base font-bold text-text-muted max-md:hidden">
          <span className="sr-only">Preço unitário: </span>
          {formatEth(item.unitPrice)}
        </p>
        <div className="flex items-center gap-2 max-md:row-span-2 max-md:flex-col max-md:pr-3">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={item.available}
            onChange={setQuantity}
            disabled={update.isPending || item.available === 0}
            label={`Quantidade de ${item.name}, edição ${item.editionLabel}`}
          />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md text-primary hover:text-danger md:hidden [&_svg]:size-5"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate({ itemId: item.id, name: item.name });
            }}
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">Remover {item.name}</span>
          </button>
        </div>
        <p className="text-base font-bold text-primary-hi max-md:hidden">
          <span className="sr-only">Total do item: </span>
          {formatEth(item.lineTotal)}
        </p>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md text-primary hover:text-danger max-md:hidden [&_svg]:size-5"
          disabled={remove.isPending}
          onClick={() => {
            remove.mutate({ itemId: item.id, name: item.name });
          }}
        >
          <Trash2 aria-hidden="true" />
          <span className="sr-only">Remover {item.name}</span>
        </button>
      </div>

      {(soldOut || priceChange !== undefined || shortage !== undefined) && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-4 py-2 text-sm"
        >
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-danger" />
          {soldOut && (
            <span className="text-danger">Esta edição esgotou. Remova o item para continuar.</span>
          )}
          {shortage?.code === "INSUFFICIENT_AVAILABILITY" && (
            <span className="text-danger">
              Restam apenas {shortage.available} unidades desta edição. Ajuste a quantidade.
            </span>
          )}
          {priceChange?.code === "PRICE_CHANGED" && (
            <>
              <span className="text-text">
                O preço mudou de {formatEth(priceChange.previousPrice)} para{" "}
                <strong className="text-primary-hi">{formatEth(priceChange.currentPrice)}</strong>.
              </span>
              <button
                type="button"
                className="font-bold text-primary-hi underline-offset-4 hover:underline"
                disabled={update.isPending}
                // Saving the same quantity records the current price as seen.
                onClick={() => {
                  setQuantity(Math.min(item.quantity, item.available));
                }}
              >
                Entendi
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
