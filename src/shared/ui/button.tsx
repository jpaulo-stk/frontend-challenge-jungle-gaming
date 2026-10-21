import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import type * as React from "react";

// Mobile frames use 56px pill buttons; from `md` up the desktop frames use
// 44px buttons with a 6px radius.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border-[1.5px] border-transparent font-bold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hi aria-disabled:hover:bg-primary",
        outline:
          "border-primary bg-transparent text-text hover:bg-surface-2 aria-disabled:hover:bg-transparent",
        ghost: "bg-transparent text-text hover:bg-surface-2 aria-disabled:hover:bg-transparent",
        destructive: "border-danger bg-transparent text-danger hover:bg-surface-2",
        link: "h-auto border-0 px-0 font-normal text-primary-hi underline-offset-4 hover:underline",
      },
      size: {
        default: "h-14 rounded-full px-7 text-[15px] md:h-11 md:rounded-md md:px-5",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-14 rounded-full px-8 text-base md:h-12 md:rounded-md",
        icon: "size-14 rounded-full md:size-11 md:rounded-md",
        "icon-sm": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
