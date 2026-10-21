import { ShoppingCart } from "lucide-react";

import type { Purchase } from "@/features/nft-detail/hooks/use-purchase";
import { formatEth, mulEth } from "@/shared/lib/eth";
import { Button } from "@/shared/ui/button";
import { QuantityStepper } from "@/shared/ui/quantity-stepper";

type MobileActionBarProps = {
  name: string;
  price: string;
  purchase: Purchase;
};

/** Fixed purchase bar of the mobile frame: quantity, total and actions. */
export function MobileActionBar({ name, price, purchase }: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[32px] border-t border-border bg-surface px-6 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-text">Qtd.</span>
          <QuantityStepper
            size="sm"
            value={purchase.quantity}
            max={purchase.available}
            onChange={purchase.setQuantity}
            disabled={purchase.available === 0}
            label={`Quantidade de ${name}`}
          />
        </div>
        <p className="text-xl font-bold text-primary-hi" aria-live="polite">
          <span className="sr-only">Total: </span>
          {formatEth(mulEth(price, purchase.quantity))}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button
          className="h-[60px] flex-1 bg-linear-to-r from-primary-alt to-primary text-base"
          disabled={!purchase.canBuy}
          onClick={purchase.buy}
        >
          {purchase.pending ? "Adicionando…" : "Comprar NFT"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-[60px] rounded-full bg-surface-2 text-primary-hi"
          disabled={!purchase.canBuy}
          onClick={purchase.addToCart}
        >
          <ShoppingCart aria-hidden="true" />
          <span className="sr-only">Adicionar ao carrinho</span>
        </Button>
      </div>
    </div>
  );
}
