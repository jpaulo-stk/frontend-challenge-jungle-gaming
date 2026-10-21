import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { FieldShell } from "@/shared/ui/form-field";
import { fieldControlClassName } from "@/shared/ui/input";

type EnsFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label?: string;
  required?: boolean;
  error?: string | undefined;
};

/** "Nome ENS": the ".eth" domain selector of the layout plus the name itself. */
export function EnsField({
  label = "Nome ENS",
  required,
  error,
  className,
  ...input
}: EnsFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error}>
      {({ id, describedBy, invalid }) => (
        <div className="flex gap-2.5">
          <div className="relative shrink-0">
            <select
              aria-label="Domínio ENS"
              defaultValue=".eth"
              className={cn(fieldControlClassName, "w-19.5 appearance-none px-3 pr-7")}
            >
              <option value=".eth">.eth</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-text"
            />
          </div>
          <input
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required ? true : undefined}
            autoComplete="off"
            className={cn(fieldControlClassName, "flex-1", className)}
            {...input}
          />
        </div>
      )}
    </FieldShell>
  );
}
