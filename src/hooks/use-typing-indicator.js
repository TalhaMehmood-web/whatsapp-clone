"use client";

import { useEffect, useRef } from "react";

import { useSocketStore } from "@/stores/socket-store";
import { useUiStore } from "@/stores/ui-store";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { SOCKET_EVENT } from "@/config/constants";

const STOP_DEBOUNCE_MS = 1500;

// Calls the typing endpoint once when the user starts typing, then once
// more after 1.5s of inactivity. Mounted inside the message input.
//
// History: this used to client-emit `typing:start` / `typing:stop` over
// Socket.io. Pusher (and most managed realtime services) don't accept
// client-emitted events without an extra auth handshake, so we route
// through `POST /api/chats/{id}/typing` instead. The server triggers the
// TYPING_UPDATE event on the chat channel. Same UX, server-validated.
function postTyping(chatId, typing) {
  // Fire-and-forget. A failed typing notification isn't worth surfacing
  // to the user — they're still typing.
  api
    .post(endpoints.chats.typing(chatId), { typing })
    .catch(() => {});
}

export function useTypingEmitter(chatId) {
  const isTypingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Cleanup: stop typing if the component unmounts mid-type.
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isTypingRef.current && chatId) {
        postTyping(chatId, false);
        isTypingRef.current = false;
      }
    },
    [chatId],
  );

  return function notifyTyping() {
    if (!chatId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      postTyping(chatId, true);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      postTyping(chatId, false);
    }, STOP_DEBOUNCE_MS);
  };
}

// Subscribes the app shell to typing:update so the UI store is always fresh.
// Mounted once at the top of the authenticated tree.
export function useTypingSubscriber() {
  const socket = useSocketStore((s) => s.socket);
  const setTyping = useUiStore((s) => s.setTyping);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = ({ chatId, userId, typing }) => {
      if (!chatId || !userId) return;
      setTyping(chatId, userId, typing);
    };
    socket.on(SOCKET_EVENT.TYPING_UPDATE, onUpdate);
    return () => socket.off(SOCKET_EVENT.TYPING_UPDATE, onUpdate);
  }, [socket, setTyping]);
}

// Read-side helper for components like the chat header.
export function useChatTyping(chatId) {
  const set = useUiStore((s) => s.typingByChat[chatId]);
  return set ?? null;
}
