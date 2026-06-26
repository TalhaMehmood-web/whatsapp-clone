"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/utils/cn"

function ScrollArea({
  className,
  children,
  ...props
}) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // `[&>div]:!block` is critical: Radix wraps the viewport's
        // children in a div with `display: table` to support sticky
        // headers. That breaks any descendant that uses `flex-1` /
        // `min-h-0` because the table cell never collapses, so the
        // ScrollArea reports zero overflow and never scrolls. Forcing
        // the wrapper to `display: block` restores normal flow.
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none [&>div]:block! focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}>
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar }
