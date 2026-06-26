"use client";

import { useUiStore } from "@/stores/ui-store";
import { NewGroupModal } from "./new-group-modal";

// Singleton host for the New group modal. Mounted at the (main) layout
// so the global keyboard shortcuts (Ctrl+Alt+Shift+N) can flip the modal
// open from any screen — not just when the chat-list header is rendered.
export function NewGroupHost() {
  const open = useUiStore((s) => s.newGroupOpen);
  const close = useUiStore((s) => s.closeNewGroup);
  return <NewGroupModal open={open} onOpenChange={(v) => !v && close()} />;
}
