"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COPY } from "@/config/constants";
import { KEYBOARD_SHORTCUTS } from "./keyboard-shortcuts-data";

export function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{COPY.SHORTCUTS_TITLE}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 gap-x-10 gap-y-2 px-1 md:grid-cols-2">
            {KEYBOARD_SHORTCUTS.map(([label, keys]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="truncate text-sm text-wa-text">{label}</span>
                <div className="flex shrink-0 items-center gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded bg-wa-panel-2 px-2 py-0.5 text-[11px] font-medium text-wa-text"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {COPY.SHORTCUTS_OK}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
