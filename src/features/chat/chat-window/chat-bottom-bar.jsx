"use client";

import { useUiStore } from "@/stores/ui-store";
import { ChatComposer } from "./chat-composer";
import { SelectionBar } from "./selection-bar";

// Switches the chat panel's bottom bar between the normal composer and
// the multi-select bulk-actions bar. WhatsApp Web keeps the header in
// place during selection mode and shows the bar pinned to the bottom of
// the conversation pane, so we mirror that.
export function ChatBottomBar({ chatId }) {
  const selectionSize = useUiStore(
    (s) => s.selectionByChat[chatId]?.size ?? 0,
  );
  if (selectionSize > 0) return <SelectionBar chatId={chatId} />;
  return <ChatComposer chatId={chatId} />;
}
