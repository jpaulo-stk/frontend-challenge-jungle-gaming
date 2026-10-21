import type * as React from "react";
import { toast } from "sonner";

type UnavailableActionProps = Omit<
  React.ComponentProps<"button">,
  "type" | "onClick" | "aria-disabled"
> & {
  /** What the control would do, e.g. "Criadores". Used in the notice. */
  feature: string;
};

/**
 * Control from the layout whose destination is outside the delivery scope.
 * It stays focusable, is announced as unavailable and explains itself on
 * activation instead of pretending to work.
 */
export function UnavailableAction({ feature, children, ...props }: UnavailableActionProps) {
  return (
    <button
      type="button"
      aria-disabled="true"
      onClick={() => {
        toast.info(`${feature} não está disponível nesta demonstração.`);
      }}
      {...props}
    >
      {children}
      <span className="sr-only"> (indisponível nesta demonstração)</span>
    </button>
  );
}
