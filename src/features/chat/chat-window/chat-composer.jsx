"use client";

import { useChatQuery } from "@/tanstack/chat/queries";
import { useBlockedUsersQuery } from "@/tanstack/users/queries";
import { MessageInput } from "./message-input";
import { BlockedBanner } from "./blocked-banner";

// Wraps the input + the blocked banner. Renders whichever is appropriate
// based on whether the current user has blocked the 1:1 peer.
export function ChatComposer({ chatId }) {
  const { data } = useChatQuery(chatId);
  const { data: blocked } = useBlockedUsersQuery();
  const peer = data?.chat?.isGroup ? null : data?.peers?.[0];
  const isBlocked = peer && (blocked ?? []).some((b) => b.id === peer.id);

  if (isBlocked) return <BlockedBanner chatId={chatId} />;
  return <MessageInput chatId={chatId} />;
}
