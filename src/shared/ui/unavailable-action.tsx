import type * as React from "react";
import { toast } from "sonner";

type UnavailableActionProps = Omit<
  React.ComponentProps<"button">,
  "type" | "onClick" | "aria-disabled"
> & {
  feature: string;
};

// Out-of-scope action: focusable, announced as unavailable, explains itself on click
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
