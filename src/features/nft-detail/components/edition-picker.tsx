import { cn } from "cn";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import type { Edition, EditionId } from "@/shared/api/contracts/nft";

type EditionPickerProps = {
  editions: Edition[];
  value: EditionId | undefined;
  onChange: (edition: EditionId) => void;
};

/** "Edição:" chips. A sold-out edition stays visible, disabled, with the reason in text. */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const soldOut = editions.filter((edition) => edition.available === 0);

  return (
    <div>
      <p id="edition-label" className="text-[15px] font-bold text-text">
        Edição:
      </p>
      <RadioGroupPrimitive.Root
        aria-labelledby="edition-label"
        aria-describedby={soldOut.length > 0 ? "edition-sold-out" : undefined}
        value={value ?? ""}
        onValueChange={(next) => {
          onChange(next as EditionId);
        }}
        className="mt-3 flex flex-wrap gap-2"
      >
        {editions.map((edition) => (
          <RadioGroupPrimitive.Item
            key={edition.id}
            value={edition.id}
            disabled={edition.available === 0}
            className={cn(
              "h-7 rounded-full border-[1.5px] px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=checked]:border-primary data-[state=checked]:font-bold data-[state=checked]:text-primary-hi",
              "data-[state=unchecked]:border-border data-[state=unchecked]:text-text-muted",
              "disabled:cursor-not-allowed disabled:text-text-dim disabled:line-through",
            )}
          >
            {edition.label}
            {edition.available === 0 && <span className="sr-only"> (esgotada)</span>}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
      {soldOut.length > 0 && (
        <p id="edition-sold-out" className="mt-2 text-xs text-text-dim">
          {soldOut.length === 1 ? "Esgotada" : "Esgotadas"}:{" "}
          {soldOut.map((edition) => edition.label).join(", ")}.
        </p>
      )}
    </div>
  );
}
