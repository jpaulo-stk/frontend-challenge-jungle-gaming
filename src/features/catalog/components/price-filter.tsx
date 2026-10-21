import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";

type PriceFilterProps = {
  /** Catalog bounds from the API, as decimal strings. */
  bounds: { min: string; max: string };
  /** Currently applied range from the URL. */
  value: { min: string | undefined; max: string | undefined };
  onApply: (range: { priceMin: string | undefined; priceMax: string | undefined }) => void;
};

const STEP = 0.01;

// The slider works with numbers for its UI only; what leaves this component is
// always a decimal string with two places, as the API expects.
const toNumber = (value: string) => Number(value);
const toAmount = (value: number) => value.toFixed(2);
const formatBr = (value: number) => value.toFixed(2).replace(".", ",");

/** "Faixa de preço": dual slider, applied explicitly with the "Aplicar" button. */
export function PriceFilter({ bounds, value, onApply }: PriceFilterProps) {
  const lower = toNumber(bounds.min);
  const upper = toNumber(bounds.max);
  const [range, setRange] = useState<[number, number]>([
    value.min ? toNumber(value.min) : lower,
    value.max ? toNumber(value.max) : upper,
  ]);
  const [from, to] = range;

  const apply = () => {
    onApply({
      priceMin: from > lower ? toAmount(from) : undefined,
      priceMax: to < upper ? toAmount(to) : undefined,
    });
  };

  return (
    <fieldset>
      <legend className="text-lg leading-7 font-bold text-text">Faixa de preço</legend>
      <Slider
        className="mt-4 px-3"
        min={lower}
        max={upper}
        step={STEP}
        value={range}
        minStepsBetweenThumbs={1}
        thumbLabels={["Preço mínimo", "Preço máximo"]}
        onValueChange={(next) => {
          const [nextFrom = lower, nextTo = upper] = next;
          setRange([nextFrom, nextTo]);
        }}
      />
      <p className="mt-3 px-3 text-[15px] text-text-muted" aria-live="polite">
        Preço: {formatBr(from)} - {formatBr(to)} ETH
      </p>
      <Button size="sm" className="mt-3 ml-3 h-9 w-23 text-base" onClick={apply}>
        Aplicar
      </Button>
    </fieldset>
  );
}
