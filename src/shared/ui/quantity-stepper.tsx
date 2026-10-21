import { cva } from "class-variance-authority";
import { cn } from "cn";
import { Minus, Plus } from "lucide-react";
import { useId } from "react";

const stepButton = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors outline-none hover:bg-primary-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-dim",
  {
    variants: {
      size: {
        // Detail page (desktop frame): tall 32×48 pills.
        md: "h-12 w-8 [&_svg]:size-5",
        // Cart rows and mobile action bar: compact pills.
        sm: "h-7 w-5 [&_svg]:size-3.5",
      },
    },
  },
);

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** Available units for the selected edition. */
  max: number;
  min?: number;
  /** Names the control, e.g. "Quantidade de Emerald Ape #042". */
  label: string;
  size?: "md" | "sm";
  disabled?: boolean;
  className?: string;
};

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  label,
  size = "md",
  disabled = false,
  className,
}: QuantityStepperProps) {
  const limitId = useId();
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center", size === "md" ? "gap-4" : "gap-3", className)}
    >
      <button
        type="button"
        className={stepButton({ size })}
        onClick={() => {
          onChange(value - 1);
        }}
        disabled={disabled || atMin}
        aria-label="Diminuir quantidade"
      >
        <Minus aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        className={cn(
          "min-w-[2ch] text-center tabular-nums",
          size === "md" ? "text-lg" : "text-sm",
        )}
      >
        {value}
      </output>
      <button
        type="button"
        className={stepButton({ size })}
        onClick={() => {
          onChange(value + 1);
        }}
        disabled={disabled || atMax}
        aria-label="Aumentar quantidade"
        aria-describedby={atMax ? limitId : undefined}
      >
        <Plus aria-hidden="true" />
      </button>
      {atMax && (
        <span id={limitId} className="sr-only">
          Limite de {max} {max === 1 ? "unidade" : "unidades"} disponível para esta edição.
        </span>
      )}
    </div>
  );
}
