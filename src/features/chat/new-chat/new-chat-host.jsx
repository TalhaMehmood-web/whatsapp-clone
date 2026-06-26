"use client";

import { useUiStore } from "@/stores/ui-store";
import { NewChatModal } from "./new-chat-modal";

// Singleton host for the New chat modal. Mounted at the (main) layout so
// the global keyboard shortcuts (Ctrl+Alt+N) can flip the modal open
// from any screen — not just when the chat-list header is rendered.
export function NewChatHost() {
  const open = useUiStore((s) => s.newChatOpen);
  const close = useUiStore((s) => s.closeNewChat);
  return <NewChatModal open={open} onOpenChange={(v) => !v && close()} />;
}
