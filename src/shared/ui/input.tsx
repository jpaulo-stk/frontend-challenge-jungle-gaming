import { cn } from "cn";
import type * as React from "react";

export const fieldControlClassName =
  "h-14 w-full min-w-0 rounded-md border-[1.5px] border-input bg-surface px-4 text-sm text-text transition-colors outline-none placeholder:text-text-dim focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/30 md:h-11";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldControlClassName,
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
