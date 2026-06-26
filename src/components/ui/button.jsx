import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Sizes whose hit area is a square — there's no room for both a spinner
// and the original icon. For these, the loading state swaps the children
// out entirely so only the spinner is visible.
const ICON_SIZES = new Set(["icon", "icon-xs", "icon-sm", "icon-lg"]);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button";
  const isDisabled = disabled || loading;
  const isIconOnly = ICON_SIZES.has(size);

  // When the consumer used `asChild` they own the inner tree (so they can
  // pass <Link>/<a> etc.). We can't inject a spinner there without
  // breaking Slot's single-child contract, so just forward state and let
  // the caller style their slot via data-loading.
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  // Body rendering:
  //  - Icon-only + loading: ONLY the spinner (never both icon + spinner).
  //  - Text + loading: spinner first, then optional loadingText or the
  //    original children. Children are rendered as direct flex items so
  //    icons and text sit on one row (the parent button is already
  //    `inline-flex items-center gap-N`).
  let body;
  if (loading && isIconOnly) {
    body = <Loader2 className="size-4 animate-spin" />;
  } else if (loading) {
    body = (
      <>
        <Loader2 className="size-4 animate-spin" />
        {loadingText ?? children}
      </>
    );
  } else {
    body = children;
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {body}
    </Comp>
  );
}

export { Button, buttonVariants };
