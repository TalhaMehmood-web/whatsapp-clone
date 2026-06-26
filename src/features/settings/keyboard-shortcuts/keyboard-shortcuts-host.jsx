"use client";

import { useUiStore } from "@/stores/ui-store";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";

// Mount once at the (main) layout level. Settings list opens this via
// `useUiStore.openKeyboardShortcuts`.
export function KeyboardShortcutsHost() {
  const open = useUiStore((s) => s.keyboardShortcutsOpen);
  const close = useUiStore((s) => s.closeKeyboardShortcuts);
  return (
    <KeyboardShortcutsDialog
      open={open}
      onOpenChange={(v) => !v && close()}
    />
  );
}
