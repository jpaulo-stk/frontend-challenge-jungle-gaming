import { cn } from "cn";

import { formatEth } from "@/shared/lib/eth";

type OrderTotalsProps = {
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  estimating?: boolean;
  className?: string;
};

export function OrderTotals({
  subtotal,
  discount,
  networkFee,
  total,
  estimating = false,
  className,
}: OrderTotalsProps) {
  return (
    <dl
      aria-busy={estimating}
      className={cn("flex flex-col gap-3 text-[15px] text-text", className)}
    >
      <div className="flex justify-between gap-4">
        <dt>Subtotal</dt>
        <dd className="text-base">{formatEth(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>Desconto do lançamento</dt>
        <dd className="text-base">(-) {formatEth(discount)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>Taxa de rede</dt>
        <dd className="flex flex-col items-end text-base">
          {formatEth(networkFee)}
          <span className="text-xs text-primary-hi">Taxa estimada</span>
        </dd>
      </div>
      <div className="mt-2 flex justify-between gap-4 border-t border-border pt-4 font-bold">
        <dt>Total</dt>
        <dd className="text-lg text-primary-hi">
          {estimating ? (
            <span className="text-sm font-normal text-text-muted">Atualizando… </span>
          ) : null}
          {formatEth(total)}
        </dd>
      </div>
    </dl>
  );
}
