import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "h-6 rounded-sm bg-primary px-2 text-xs font-bold tracking-wide text-primary-foreground uppercase",
        outline: "h-7 rounded-full border-[1.5px] border-border px-3 text-[13px] text-text-muted",
        success: "h-6 rounded-sm border-[1.5px] border-success px-2 text-xs font-bold text-success",
        danger: "h-6 rounded-sm border-[1.5px] border-danger px-2 text-xs font-bold text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

function Badge({ className, variant = "default", asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
