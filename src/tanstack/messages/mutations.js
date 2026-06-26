import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { MessageType, ReceiptStatus } from "@/models/enums";

// Optimistically appends a new message to the *first* page (newest page) of
// the infinite cache. Rolls back the whole snapshot on error.
export const useSendMessageMutation = (chatId) => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.chats.messages(chatId), payload).then((r) => r.data),

    onMutate: async (payload) => {
      const key = queryKeys.messages.list(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      // Media + voice flows insert their own optimistic bubble (with
      // local blob preview) before calling send. Skip the generic one
      // here so we don't end up with two stacked rows.
      if (payload.type && payload.type !== MessageType.TEXT) {
        return { prev };
      }

      const optimistic = {
        id: `temp-${Date.now()}`,
        chatId,
        senderId: user?.id,
        content: payload.content ?? null,
        type: payload.type ?? MessageType.TEXT,
        mediaUrl: payload.mediaUrl ?? null,
        mediaMime: payload.mediaMime ?? null,
        mediaThumbUrl: payload.mediaThumbUrl ?? null,
        mediaSizeBytes: payload.mediaSizeBytes ?? null,
        mediaDuration: payload.mediaDuration ?? null,
        fileName: payload.fileName ?? null,
        caption: payload.caption ?? null,
        replyToId: payload.replyToId ?? null,
        metadata: payload.metadata ?? null,
        forwardedFrom: null,
        forwardCount: 0,
        expiresAt: null,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user
          ? { id: user.id, name: user.name, avatar: user.avatar ?? null }
          : null,
        receipts: [
          { userId: user?.id, status: ReceiptStatus.READ },
        ],
        reactions: [],
        replyTo: null,
        __optimistic: true,
      };

      qc.setQueryData(key, (old) => {
        if (!old) {
          return {
            pageParams: [null],
            pages: [{ messages: [optimistic], nextCursor: null }],
          };
        }
        const pages = old.pages.map((p, i) =>
          i === 0 ? { ...p, messages: [...p.messages, optimistic] } : p,
        );
        return { ...old, pages };
      });

      return { prev };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages.list(chatId) });
      qc.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
};

// Posts a single file to /api/messages/upload, returns the normalised asset:
//   { mediaUrl, mediaMime, mediaThumbUrl, mediaSizeBytes, mediaDuration, fileName }
export const useUploadMediaMutation = () =>
  useMutation({
    mutationFn: async ({ file, kind, onProgress }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await api.post(endpoints.messages.upload, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(e.loaded / e.total);
        },
      });
      return res.data;
    },
  });

// ─── Reactions ─────────────────────────────────────────────────────────────

// Optimistically toggles a reaction on a message inside its chat's cache.
export const useReactToMessageMutation = (chatId) => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: ({ messageId, emoji }) =>
      api
        .post(endpoints.messages.react(messageId), { emoji })
        .then((r) => r.data),
    onMutate: async ({ messageId, emoji }) => {
      const key = queryKeys.messages.list(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) =>
        patchMessage(old, messageId, (m) => {
          const list = m.reactions ?? [];
          const mine = list.find((r) => r.userId === user?.id);
          let next;
          if (mine?.emoji === emoji) {
            next = list.filter((r) => r.userId !== user?.id);
          } else if (mine) {
            next = list.map((r) =>
              r.userId === user?.id ? { ...r, emoji } : r,
            );
          } else {
            next = [...list, { userId: user?.id, emoji }];
          }
          return { ...m, reactions: next };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev),
  });
};

// ─── Star ──────────────────────────────────────────────────────────────────

export const useStarMessageMutation = (chatId) => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: ({ messageId, value }) =>
      value
        ? api.post(endpoints.messages.star(messageId)).then((r) => r.data)
        : api.delete(endpoints.messages.star(messageId)).then((r) => r.data),
    onMutate: async ({ messageId, value }) => {
      const key = queryKeys.messages.list(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) =>
        patchMessage(old, messageId, (m) => {
          const list = m.starredBy ?? [];
          const next = value
            ? [...list.filter((s) => s.userId !== user?.id), { userId: user?.id }]
            : list.filter((s) => s.userId !== user?.id);
          return { ...m, starredBy: next };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.messages.starred }),
  });
};

// Pin / unpin a single message. Optimistically updates the chat detail
// cache so the banner appears immediately; rollback on error. The server
// also fans a `message:pinned` event to every chat member, picked up by
// the realtime layer (see useChatSocketSync).
export const usePinMessageMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, value }) =>
      value
        ? api.post(endpoints.messages.pin(messageId)).then((r) => r.data)
        : api.delete(endpoints.messages.pin(messageId)).then((r) => r.data),
    onMutate: async ({ messageId, value }) => {
      const key = queryKeys.chats.detail(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => {
        if (!old?.chat) return old;
        const current = old.chat.pinnedMessageIds ?? [];
        const next = value
          ? [messageId, ...current.filter((id) => id !== messageId)].slice(0, 3)
          : current.filter((id) => id !== messageId);
        return { ...old, chat: { ...old.chat, pinnedMessageIds: next } };
      });
      return { prev };
    },
    onSuccess: (data) => {
      if (!data?.pinnedMessageIds) return;
      qc.setQueryData(queryKeys.chats.detail(chatId), (old) =>
        old?.chat
          ? {
              ...old,
              chat: { ...old.chat, pinnedMessageIds: data.pinnedMessageIds },
            }
          : old,
      );
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.chats.detail(chatId), ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) }),
  });
};

// Report a message. Fire-and-forget — no cache state needs to change.
export const useReportMessageMutation = () =>
  useMutation({
    mutationFn: ({ messageId, reason }) =>
      api
        .post(endpoints.messages.report(messageId), { reason })
        .then((r) => r.data),
  });

// ─── Edit / Delete / Forward ───────────────────────────────────────────────

export const useEditMessageMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }) =>
      api
        .patch(endpoints.messages.detail(messageId), { content })
        .then((r) => r.data),
    onMutate: async ({ messageId, content }) => {
      const key = queryKeys.messages.list(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) =>
        patchMessage(old, messageId, (m) => ({
          ...m,
          content,
          editedAt: new Date().toISOString(),
        })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev),
  });
};

// Delete a message in one of two modes:
//   - "everyone" (default): tombstones the row server-side and the
//     server fans MESSAGE_DELETED so peers swap to the "this message
//     was deleted" pill. Optimistic patch flips the row to the tombstone
//     shape too.
//   - "me": adds a per-user MessageHidden row server-side. We just yank
//     the message out of the cache locally — peers see no change.
export const useDeleteMessageMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, mode = "everyone" }) =>
      api
        .delete(endpoints.messages.detail(messageId), {
          params: { mode },
        })
        .then((r) => r.data),
    onMutate: async ({ messageId, mode = "everyone" }) => {
      const key = queryKeys.messages.list(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      if (mode === "me" || mode === "purge") {
        qc.setQueryData(key, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: p.messages.filter((m) => m.id !== messageId),
            })),
          };
        });
      } else {
        qc.setQueryData(key, (old) =>
          patchMessage(old, messageId, (m) => ({
            ...m,
            content: null,
            mediaUrl: null,
            deletedAt: new Date().toISOString(),
          })),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev),
  });
};

export const useForwardMessageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, chatIds }) =>
      api
        .post(endpoints.messages.forward(messageId), { chatIds })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chats.all }),
  });
};

// Shared helper for the *single-message* mutations above. Walks every page
// of the infinite cache and replaces the matching message via `transform`.
function patchMessage(cache, messageId, transform) {
  if (!cache) return cache;
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) =>
        m.id === messageId ? transform(m) : m,
      ),
    })),
  };
}
