"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUploadMediaMutation } from "@/tanstack/messages/mutations";
import { useCreateChannelPostMutation } from "@/tanstack/channels/mutations";
import { MessageType } from "@/models/enums";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
} from "@/config/constants";
import { documentIcon } from "@/utils/document-icon";
import { cn } from "@/utils/cn";

// Owner-only composer for channel posts. Supports text alone, media
// alone, or both (media + caption — matches WhatsApp Web's chat
// composer affordance for media-with-text).
//
// Flow:
//   1. User picks a file via the paperclip → we hold it in local
//      state + render an inline preview chip above the textarea.
//   2. User can type a caption alongside.
//   3. Send → upload to Cloudinary first (with mediaPublicId/Resource
//      so the per-post delete + the daily cron can destroy the asset
//      later), then create the post in one round-trip.
//
// Cancelling the attachment clears the preview without uploading.
// 50 MB cap enforced client-side; the server enforces it again.
export function ChannelPostComposer({ channelId }) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const upload = useUploadMediaMutation();
  const create = useCreateChannelPostMutation(channelId);
  const sending = upload.isPending || create.isPending;

  const clearAttachment = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const onPickFile = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (picked.size > MAX_UPLOAD_BYTES) {
      toast.error(`File too large. Max ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    setFile(picked);
    // Local blob URL for the inline preview thumbnail. Revoked on
    // clearAttachment / successful send.
    if (picked.type?.startsWith("image/") || picked.type?.startsWith("video/")) {
      setPreviewUrl(URL.createObjectURL(picked));
    } else {
      setPreviewUrl(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (sending) return;
    if (!trimmed && !file) return;

    // Media-only or media+caption path.
    if (file) {
      const kind = kindFromFile(file);
      try {
        const asset = await upload.mutateAsync({ file, kind });
        await create.mutateAsync({
          content: trimmed || undefined,
          type: kind,
          mediaUrl: asset.mediaUrl,
          mediaMime: asset.mediaMime,
          mediaThumbUrl: asset.mediaThumbUrl,
          mediaSizeBytes: asset.mediaSizeBytes,
          mediaDuration: asset.mediaDuration,
          fileName: asset.fileName,
          mediaPublicId: asset.mediaPublicId,
          mediaResource: asset.mediaResource,
        });
        setValue("");
        clearAttachment();
      } catch (err) {
        toast.error(err.response?.data?.error ?? "Failed to post");
      }
      return;
    }

    // Text-only path.
    create.mutate(
      { content: trimmed, type: MessageType.TEXT },
      {
        onSuccess: () => setValue(""),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to post"),
      },
    );
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 border-t border-wa-border bg-wa-panel-2 px-3 py-2"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
        hidden
        onChange={onPickFile}
      />

      {file && (
        <AttachmentPreview
          file={file}
          previewUrl={previewUrl}
          onClear={clearAttachment}
          disabled={sending}
        />
      )}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <Paperclip className="size-5" />
        </Button>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            file ? "Add a caption…" : "Share an update with subscribers…"
          }
          rows={1}
          maxLength={2000}
          disabled={sending}
          className="block max-h-32 min-h-10 flex-1 resize-none rounded-lg border-0 bg-wa-panel px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Post"
          loading={sending}
          disabled={!value.trim() && !file}
          className="bg-wa-green text-white hover:bg-wa-green/90"
        >
          {sending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <SendHorizontal className="size-5" />
          )}
        </Button>
      </div>
    </form>
  );
}

// Inline preview chip shown above the textarea when a file is staged.
// Three render branches: image thumb, video thumb (first frame as a
// muted poster), or doc card with the brand-coloured icon.
function AttachmentPreview({ file, previewUrl, onClear, disabled }) {
  const isImage = file.type?.startsWith("image/");
  const isVideo = file.type?.startsWith("video/");
  return (
    <div className="flex items-center gap-3 rounded-lg border border-wa-border bg-wa-panel p-2">
      {isImage && previewUrl && (
        <img
          src={previewUrl}
          alt=""
          className="size-12 shrink-0 rounded object-cover"
        />
      )}
      {isVideo && previewUrl && (
        <video
          src={previewUrl}
          muted
          playsInline
          preload="metadata"
          className="size-12 shrink-0 rounded object-cover"
        />
      )}
      {!isImage && !isVideo && (
        <DocPreview file={file} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">
          {file.name ?? "Attachment"}
        </span>
        <span className="text-xs text-wa-text-muted">
          {formatBytes(file.size ?? 0)}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remove attachment"
        onClick={onClear}
        disabled={disabled}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function DocPreview({ file }) {
  const { Icon, accent } = documentIcon({
    mime: file.type ?? "",
    fileName: file.name ?? "",
  });
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded bg-wa-panel-2">
      <Icon className={cn("size-6", accent)} />
    </span>
  );
}

function kindFromFile(file) {
  const mime = file.type ?? "";
  if (mime.startsWith("image/")) return MessageType.IMAGE;
  if (mime.startsWith("video/")) return MessageType.VIDEO;
  if (mime.startsWith("audio/")) return MessageType.AUDIO;
  return MessageType.DOCUMENT;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
