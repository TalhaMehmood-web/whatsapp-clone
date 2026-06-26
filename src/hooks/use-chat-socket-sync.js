"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSocketStore } from "@/stores/socket-store";
import { useAuthStore } from "@/stores/auth-store";
import { queryKeys } from "@/config/query-keys";
import { COPY, ROUTES, SOCKET_EVENT } from "@/config/constants";
import { ReceiptStatus } from "@/models/enums";
import { previewText } from "@/utils/message-format";

// Subscribes the app shell to message:new and message:read so every cached
// chat list + open chat thread updates in real time. Mounted once.
export function useChatSocketSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (!socket) return undefined;

    // De-dupe across rooms: the server emits MESSAGE_NEW to both the chat
    // room and every member's user room, so a peer who has the chat open
    // receives the event twice. Track ids we've already processed.
    const seenMessageIds = new Set();

    const onNew = (message) => {
      if (!message?.id) return;
      if (seenMessageIds.has(message.id)) return;
      seenMessageIds.add(message.id);
      // Bound the set so it doesn't grow forever.
      if (seenMessageIds.size > 500) {
        const trim = seenMessageIds.values().next().value;
        seenMessageIds.delete(trim);
      }

      // 1) Append to the open thread (if cached). Replace any optimistic
      // version with the same content first.
      const key = queryKeys.messages.list(message.chatId);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        const pages = old.pages.map((page, i) => {
          if (i !== 0) return page;
          const existing = page.messages.some((m) => m.id === message.id);
          if (existing) return page;
          const withoutOptimistic = page.messages.filter(
            (m) =>
              !m.__optimistic ||
              m.content !== message.content ||
              m.senderId !== message.senderId,
          );
          return { ...page, messages: [...withoutOptimistic, message] };
        });
        return { ...old, pages };
      });

      // 2) Patch every cached chat list:
      //    - bump lastMessage + unreadCount on the matching row
      //    - re-sort so the row floats to the top of its pinned bucket
      //    - if the chat isn't in the cache at all (first message ever, or
      //      we haven't loaded that filter yet), invalidate so it refetches
      const isSelf = message.senderId === userId;
      // Don't bump the badge for the chat I'm currently viewing —
      // markChatRead resets it anyway, but skipping avoids a flash of +1
      // between the socket event and the read mutation settling.
      const isViewingChat = pathname.startsWith(
        ROUTES.CHAT_DETAIL(message.chatId),
      );
      let touchedAny = false;
      const patchEntry = (entry) =>
        entry.chat?.id !== message.chatId
          ? entry
          : {
              ...entry,
              chat: { ...entry.chat, updatedAt: message.createdAt },
              lastMessage: message,
              membership:
                isSelf || isViewingChat
                  ? entry.membership
                  : {
                      ...entry.membership,
                      unreadCount: (entry.membership?.unreadCount ?? 0) + 1,
                    },
            };

      // The chats.all prefix matches several cache shapes:
      //   - Array<Entry>                       (chats.list)
      //   - { chats: Array<Entry>, count }     (chats.archived)
      //   - { chat, peers }                    (chats.detail)
      //   - whatever members/media return
      // Only the first two carry the entry shape we patch; everything else
      // is skipped. Defensive .chat?.id guards stale optimistic entries.
      qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
        ([cacheKey, data]) => {
          if (Array.isArray(data)) {
            const present = data.some((e) => e?.chat?.id === message.chatId);
            if (!present) return;
            touchedAny = true;
            qc.setQueryData(cacheKey, sortChatList(data.map(patchEntry)));
            return;
          }
          if (data && Array.isArray(data.chats)) {
            const present = data.chats.some(
              (e) => e?.chat?.id === message.chatId,
            );
            if (!present) return;
            touchedAny = true;
            qc.setQueryData(cacheKey, {
              ...data,
              chats: sortChatList(data.chats.map(patchEntry)),
            });
          }
        },
      );
      // Cold cache (chat row wasn't loaded yet): just invalidate so the
      // next render fetches the full list, which will include the new row.
      if (!touchedAny) {
        qc.invalidateQueries({ queryKey: queryKeys.chats.all });
      }

      // 3) In-app toast banner (WhatsApp Desktop behaviour). Skip when the
      // sender is us, when we're already viewing the chat, when the chat
      // is muted, or for SYSTEM messages (the call bubble already speaks
      // for itself in the chat).
      if (isSelf) return;
      if (pathname.startsWith(ROUTES.CHAT_DETAIL(message.chatId))) return;
      if (message.type === "SYSTEM") return;
      const entry = lookupChatEntry(qc, message.chatId);
      const mutedUntil = entry?.membership?.mutedUntil;
      if (mutedUntil && new Date(mutedUntil) > new Date()) return;
      const senderName = message.sender?.name ?? "New message";
      const title =
        entry?.chat?.isGroup && entry?.chat?.name
          ? `${senderName} · ${entry.chat.name}`
          : senderName;
      toast(title, {
        description: previewText(message) || "Sent you a message",
        onClick: () => router.push(ROUTES.CHAT_DETAIL(message.chatId)),
      });
    };

    const onRead = ({ chatId, userId: readerId }) => {
      // Flip every outgoing message in this chat to READ for the given reader.
      const key = queryKeys.messages.list(chatId);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => ({
            ...m,
            receipts: (m.receipts ?? []).map((r) =>
              r.userId === readerId
                ? { ...r, status: ReceiptStatus.READ }
                : r,
            ),
          })),
        }));
        return { ...old, pages };
      });

      // If the reader was the *current user*, drop our unread count for the chat.
      if (readerId === userId) {
        qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
          ([cacheKey, data]) => {
            if (!Array.isArray(data)) return;
            qc.setQueryData(
              cacheKey,
              data.map((entry) =>
                entry.chat.id === chatId
                  ? {
                      ...entry,
                      membership: { ...entry.membership, unreadCount: 0 },
                    }
                  : entry,
              ),
            );
          },
        );
      }
    };

    // When the server adds us to a new group it fires GROUP_ADDED on our
    // user channel. Cheapest correct response is to invalidate every
    // cached chats.list query so the new row shows up in whatever tab
    // the user is currently looking at.
    const onGroupAdded = () => {
      qc.invalidateQueries({ queryKey: queryKeys.chats.all });
    };

    // When we're removed from a group, drop the row from every cached
    // chats.list, evict the chat detail + messages caches, and bounce
    // back to the index if we're currently looking at it.
    const onGroupRemoved = ({ chatId, chatName }) => {
      qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
        ([cacheKey, data]) => {
          if (!Array.isArray(data)) return;
          qc.setQueryData(
            cacheKey,
            data.filter((entry) => entry.chat.id !== chatId),
          );
        },
      );
      qc.removeQueries({ queryKey: queryKeys.chats.detail(chatId) });
      qc.removeQueries({ queryKey: queryKeys.messages.list(chatId) });
      qc.removeQueries({ queryKey: queryKeys.chats.members(chatId) });

      toast.info(
        COPY.NOTIFICATION_GROUP_REMOVED_BODY({
          groupName: chatName ?? "a group",
        }),
      );

      if (pathname.startsWith(ROUTES.CHAT_DETAIL(chatId))) {
        router.replace(ROUTES.CHAT_INDEX);
      }
    };

    // Membership of a group we belong to changed (someone else left or
    // was removed). Refetch detail + members so headcounts stay correct.
    const onGroupUpdate = ({ chatId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) });
      qc.invalidateQueries({ queryKey: queryKeys.chats.members(chatId) });
    };

    // Server fans `message:pinned` whenever the chat's pinned-message
    // stack changes. Payload carries the full id list (newest first); we
    // just replace the cached array so the banner re-renders.
    const onPinned = ({ chatId, pinnedMessageIds }) => {
      qc.setQueryData(queryKeys.chats.detail(chatId), (old) =>
        old && old.chat
          ? { ...old, chat: { ...old.chat, pinnedMessageIds } }
          : old,
      );
    };

    // Patch a single message inside every cached page for one chat. The
    // updater receives the matched message and returns the replacement.
    // Used by the three handlers below so peers see reactions / edits /
    // deletes without a refetch.
    const patchMessageInChat = (chatId, messageId, updater) => {
      const key = queryKeys.messages.list(chatId);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        let touched = false;
        const pages = old.pages.map((page) => {
          const messages = page.messages.map((m) => {
            if (m.id !== messageId) return m;
            touched = true;
            return updater(m);
          });
          return touched ? { ...page, messages } : page;
        });
        return touched ? { ...old, pages } : old;
      });
    };

    // Peer reacted (or removed a reaction). Server sends the canonical
    // reaction list so we can just replace.
    const onReaction = ({ messageId, reactions }) => {
      // The event doesn't include chatId; loop every cached messages.list
      // and patch any that contain the message.
      qc.getQueriesData({ queryKey: queryKeys.messages.all }).forEach(
        ([key, data]) => {
          if (!data?.pages) return;
          const present = data.pages.some((p) =>
            p.messages?.some((m) => m.id === messageId),
          );
          if (!present) return;
          qc.setQueryData(key, {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) =>
                m.id === messageId ? { ...m, reactions } : m,
              ),
            })),
          });
        },
      );
    };

    // Peer edited a message — replace it wholesale (server sends the full
    // updated row including the new editedAt).
    const onEdited = (updated) => {
      if (!updated?.id || !updated.chatId) return;
      patchMessageInChat(updated.chatId, updated.id, () => updated);
    };

    // Peer deleted a message — flip it to the tombstone shape so the
    // bubble shows "This message was deleted".
    const onDeleted = ({ id, chatId }) => {
      if (!id || !chatId) return;
      patchMessageInChat(chatId, id, (m) => ({
        ...m,
        content: null,
        mediaUrl: null,
        deletedAt: new Date().toISOString(),
      }));
    };

    // Sender purged a tombstoned message — drop it from every viewer's
    // cache so the "This message was deleted" pill vanishes too.
    const onPurged = ({ id, chatId }) => {
      if (!id || !chatId) return;
      const key = queryKeys.messages.list(chatId);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            messages: p.messages.filter((m) => m.id !== id),
          })),
        };
      });
    };

    socket.on(SOCKET_EVENT.MESSAGE_NEW, onNew);
    socket.on(SOCKET_EVENT.MESSAGE_READ, onRead);
    socket.on(SOCKET_EVENT.GROUP_ADDED, onGroupAdded);
    socket.on(SOCKET_EVENT.GROUP_REMOVED, onGroupRemoved);
    socket.on(SOCKET_EVENT.GROUP_UPDATE, onGroupUpdate);
    socket.on(SOCKET_EVENT.MESSAGE_PINNED, onPinned);
    socket.on(SOCKET_EVENT.MESSAGE_REACTION, onReaction);
    socket.on(SOCKET_EVENT.MESSAGE_EDITED, onEdited);
    socket.on(SOCKET_EVENT.MESSAGE_DELETED, onDeleted);
    socket.on(SOCKET_EVENT.MESSAGE_PURGED, onPurged);

    return () => {
      socket.off(SOCKET_EVENT.MESSAGE_NEW, onNew);
      socket.off(SOCKET_EVENT.MESSAGE_READ, onRead);
      socket.off(SOCKET_EVENT.GROUP_ADDED, onGroupAdded);
      socket.off(SOCKET_EVENT.GROUP_REMOVED, onGroupRemoved);
      socket.off(SOCKET_EVENT.GROUP_UPDATE, onGroupUpdate);
      socket.off(SOCKET_EVENT.MESSAGE_PINNED, onPinned);
      socket.off(SOCKET_EVENT.MESSAGE_REACTION, onReaction);
      socket.off(SOCKET_EVENT.MESSAGE_EDITED, onEdited);
      socket.off(SOCKET_EVENT.MESSAGE_DELETED, onDeleted);
      socket.off(SOCKET_EVENT.MESSAGE_PURGED, onPurged);
    };
  }, [socket, qc, userId, pathname, router]);
}

// Find the cached chat-list entry for a given chat id by scanning every
// cached list shape. Returns the first match (the entry shape is
// identical across filtered lists, so we just take whichever is loaded).
function lookupChatEntry(qc, chatId) {
  let found = null;
  qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(([, data]) => {
    if (found) return;
    if (Array.isArray(data)) {
      found = data.find((e) => e?.chat?.id === chatId) ?? null;
    } else if (data && Array.isArray(data.chats)) {
      found = data.chats.find((e) => e?.chat?.id === chatId) ?? null;
    }
  });
  return found;
}

// Mirrors the server-side sort in lib/chats.js → getChats:
//   1) pinned chats first
//   2) then by last-message time desc (falls back to chat.updatedAt)
function sortChatList(entries) {
  return [...entries].sort((a, b) => {
    const ap = a.membership?.isPinned ? 1 : 0;
    const bp = b.membership?.isPinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    const at = a.lastMessage?.createdAt ?? a.chat.updatedAt;
    const bt = b.lastMessage?.createdAt ?? b.chat.updatedAt;
    return new Date(bt) - new Date(at);
  });
}
