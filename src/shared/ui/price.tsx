import { cn } from "cn";

import { formatEth } from "@/shared/lib/eth";

type PriceProps = {
  /** Decimal string, e.g. "1.19". */
  value: string;
  /** Price before a discount; rendered struck through and labelled for screen readers. */
  previousValue?: string | undefined;
  className?: string;
};

export function Price({ value, previousValue, className }: PriceProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 text-base leading-7", className)}>
      <span className="font-bold text-primary-hi">
        {previousValue !== undefined && <span className="sr-only">Preço atual: </span>}
        {formatEth(value)}
      </span>
      {previousValue !== undefined && (
        <s className="text-text-dim">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(previousValue)}
        </s>
      )}
    </span>
  );
}
