import { cn } from "cn";
import type * as React from "react";

/**
 * Placeholder block with a shimmer sweep. Purely decorative: the region that
 * contains skeletons carries `aria-busy` and an accessible loading label.
 * Under `prefers-reduced-motion` the shimmer stays still.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface)_25%,var(--color-surface-2)_50%,var(--color-surface)_75%)] bg-size-[200%_100%] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
