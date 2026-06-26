"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  useSendMessageMutation,
  useUploadMediaMutation,
} from "@/tanstack/messages/mutations";
import { useAuthStore } from "@/stores/auth-store";
import { queryKeys } from "@/config/query-keys";
import { MessageType, ReceiptStatus } from "@/models/enums";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/config/constants";

// Opens a hidden <input type="file">, drops an optimistic bubble in the
// chat (with a `blob:` preview URL so the user sees their photo/doc
// immediately) and only then uploads + sends. The PENDING tick is driven
// by `__optimistic` on the bubble; server fan-out swaps the row in once
// the message is created.
export function useMediaUpload(chatId, { kind, accept } = {}) {
  const inputRef = useRef(null);
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [progress, setProgress] = useState(null);

  const upload = useUploadMediaMutation();
  const send = useSendMessageMutation(chatId);

  const open = () => inputRef.current?.click();

  const onChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`File too large. Max ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    const resolvedKind = kind ?? kindFromMime(file.type, file.name);

    const previewUrl = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}`;
    const key = queryKeys.messages.list(chatId);

    qc.setQueryData(key, (old) => {
      const optimistic = {
        id: tempId,
        chatId,
        senderId: me?.id,
        content: null,
        type: resolvedKind,
        // Local blob URL — the bubble's <img>/<video>/<a> renders against
        // this until the server row replaces the optimistic one.
        mediaUrl: previewUrl,
        mediaMime: file.type,
        mediaSizeBytes: file.size,
        mediaDuration: null,
        fileName: file.name,
        caption: null,
        replyToId: null,
        forwardedFrom: null,
        forwardCount: 0,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: me
          ? { id: me.id, name: me.name, avatar: me.avatar ?? null }
          : null,
        receipts: [{ userId: me?.id, status: ReceiptStatus.READ }],
        reactions: [],
        starredBy: [],
        replyTo: null,
        __optimistic: true,
      };
      if (!old) {
        return {
          pageParams: [null],
          pages: [{ messages: [optimistic], nextCursor: null }],
        };
      }
      return {
        ...old,
        pages: old.pages.map((p, i) =>
          i === 0 ? { ...p, messages: [...p.messages, optimistic] } : p,
        ),
      };
    });

    // Mirror the upload progress into the cached optimistic message so
    // MediaPreview can render the WhatsApp-style circular progress ring
    // without any extra plumbing — every bubble reads from the same
    // cache so the right one updates automatically.
    const updateOptimisticProgress = (value) => {
      setProgress(value);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            messages: p.messages.map((m) =>
              m.id === tempId ? { ...m, __uploadProgress: value } : m,
            ),
          })),
        };
      });
    };

    try {
      updateOptimisticProgress(0);
      const asset = await upload.mutateAsync({
        file,
        kind: resolvedKind,
        onProgress: updateOptimisticProgress,
      });
      // Upload finished — bump the ring to 100% while the create-message
      // round-trip is in flight, then the socket-sync swap replaces the
      // bubble with the real one.
      updateOptimisticProgress(1);
      await send.mutateAsync({ ...asset, type: resolvedKind });
    } catch (err) {
      // Roll back the optimistic row.
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            messages: p.messages.filter((m) => m.id !== tempId),
          })),
        };
      });
      URL.revokeObjectURL(previewUrl);
      toast.error(err.response?.data?.error ?? "Upload failed");
    } finally {
      setProgress(null);
      // Give the swap-in time before freeing the blob — otherwise an
      // in-flight render flickers.
      setTimeout(() => URL.revokeObjectURL(previewUrl), 30_000);
    }
  };

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept ?? acceptFromKind(kind)}
      hidden
      onChange={onChange}
    />
  );

  return {
    open,
    hiddenInput,
    isPending: upload.isPending || send.isPending,
    progress,
  };
}

function kindFromMime(mime, name) {
  if (mime?.startsWith("image/")) return MessageType.IMAGE;
  if (mime?.startsWith("video/")) return MessageType.VIDEO;
  if (mime?.startsWith("audio/")) return MessageType.AUDIO;
  if (mime || name) return MessageType.DOCUMENT;
  return MessageType.DOCUMENT;
}

function acceptFromKind(kind) {
  switch (kind) {
    case MessageType.IMAGE:
      return "image/*";
    case MessageType.VIDEO:
      return "video/*";
    case MessageType.AUDIO:
    case MessageType.VOICE_NOTE:
      return "audio/*";
    case MessageType.DOCUMENT:
      return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv";
    default:
      return undefined;
  }
}
