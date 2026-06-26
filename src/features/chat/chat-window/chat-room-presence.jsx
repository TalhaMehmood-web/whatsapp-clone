"use client";

import { useEffect } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { useMarkChatReadMutation } from "@/tanstack/chat/mutations";
import { SOCKET_EVENT } from "@/config/constants";

// Joins the chat:<id> room on mount, leaves on unmount, and marks the chat as
// read once. Renders nothing — this is the side-effect anchor for the
// per-chat real-time lifecycle.
export function ChatRoomPresence({ chatId }) {
  const socket = useSocketStore((s) => s.socket);
  const { mutate: markRead } = useMarkChatReadMutation();

  useEffect(() => {
    if (!chatId) return undefined;
    if (socket) socket.emit(SOCKET_EVENT.CHAT_JOIN, chatId);
    markRead(chatId);
    return () => {
      if (socket) socket.emit(SOCKET_EVENT.CHAT_LEAVE, chatId);
    };
  }, [chatId, socket, markRead]);

  return null;
}
