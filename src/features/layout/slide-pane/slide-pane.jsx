"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils/cn";

// Animated panel that slides in over a list pane (the WhatsApp Web pattern
// for Settings → Privacy → Last seen, etc.).
//
// - `open` controls visibility.
// - `title` + back arrow render in the header; `onClose` is called from
//   the arrow.
// - `children` is the scrollable body.
//
// The panel is positioned absolute inside its parent, so the parent must
// be `relative` (the SettingsList wrapper handles that).
export function SlidePane({ open, title, onClose, children, className }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="slide-pane"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
          className={cn(
            "absolute inset-0 z-20 flex flex-col bg-wa-panel",
            className,
          )}
        >
          <header className="flex h-14 shrink-0 items-center gap-3 px-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back"
              onClick={onClose}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <ArrowLeft className="size-5" />
            </Button>
            {title && (
              <h2 className="text-lg font-medium text-wa-text">{title}</h2>
            )}
          </header>
          <ScrollArea className="flex-1">{children}</ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
