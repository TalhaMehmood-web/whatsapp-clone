"use client";

import { useEffect, useRef } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { useUiStore } from "@/stores/ui-store";
import { SOCKET_EVENT } from "@/config/constants";

const STOP_DEBOUNCE_MS = 1500;

// Emits typing:start once when the user starts typing, then typing:stop after
// 1.5s of inactivity. Mounted inside the message input.
export function useTypingEmitter(chatId) {
  const socket = useSocketStore((s) => s.socket);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Cleanup: stop typing if the component unmounts mid-type.
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isTypingRef.current && socket) {
        socket.emit(SOCKET_EVENT.TYPING_STOP, { chatId });
      }
    },
    [chatId, socket],
  );

  return function notifyTyping() {
    if (!socket) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit(SOCKET_EVENT.TYPING_START, { chatId });
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit(SOCKET_EVENT.TYPING_STOP, { chatId });
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
