"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadMediaMutation } from "@/tanstack/messages/mutations";
import { useCreateStatusMutation } from "@/tanstack/status/mutations";
import { COPY, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, ROUTES } from "@/config/constants";
import { MessageType, StatusType } from "@/models/enums";

// Opens the OS file picker on mount; once a file is chosen renders a preview
// + caption input + send button. Cancel returns to the empty status pane.
export function StatusComposerMedia() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");

  const upload = useUploadMediaMutation();
  const create = useCreateStatusMutation();
  const isVideo = file?.type?.startsWith("video/");

  // React 18+ runs effects twice in dev (Strict Mode), so a bare auto-
  // click here opens the OS file picker on mount AND on the re-mount —
  // the user sees the dialog flash twice. Gate it behind a ref so we
  // only fire once for the lifetime of the component.
  const triggeredRef = useRef(false);
  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) {
      router.replace(ROUTES.STATUS);
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      toast.error(`File too large. Max ${MAX_UPLOAD_LABEL}.`);
      router.replace(ROUTES.STATUS);
      return;
    }
    setFile(picked);
  };

  const send = async () => {
    if (!file) return;
    const kind = file.type.startsWith("video/")
      ? MessageType.VIDEO
      : MessageType.IMAGE;
    try {
      const asset = await upload.mutateAsync({ file, kind });
      await create.mutateAsync({
        type:
          kind === MessageType.VIDEO ? StatusType.VIDEO : StatusType.IMAGE,
        mediaUrl: asset.mediaUrl,
        mediaMime: asset.mediaMime,
        mediaDuration: asset.mediaDuration,
        // Forward the Cloudinary identifiers so deleteStatus + the 24h
        // expiry cron can destroy the asset on the CDN.
        mediaPublicId: asset.mediaPublicId,
        mediaResource: asset.mediaResource,
        caption: caption || undefined,
      });
      router.replace(ROUTES.STATUS);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Could not post status");
    }
  };

  const sending = upload.isPending || create.isPending;

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={onPick}
      />

      <header className="flex h-14 shrink-0 items-center gap-3 bg-wa-panel-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.replace(ROUTES.STATUS)}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-sm text-wa-text">
          {COPY.STATUS_MEDIA_BUTTON}
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center">
        {!previewUrl ? (
          <p className="text-sm text-wa-text-muted">
            Pick an image or video to share.
          </p>
        ) : isVideo ? (
          <video
            src={previewUrl}
            controls
            autoPlay
            className="max-h-full max-w-full"
          />
        ) : (
          <img src={previewUrl} alt="" className="max-h-full max-w-full" />
        )}
      </div>

      {previewUrl && (
        <footer className="flex h-16 shrink-0 items-center gap-3 border-t border-wa-border bg-wa-panel-2 px-4">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption…"
            className="border-0 bg-wa-panel"
          />
          <Button
            size="icon"
            aria-label={COPY.STATUS_SEND}
            onClick={send}
            loading={sending}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            <SendHorizontal className="size-5" />
          </Button>
        </footer>
      )}
    </div>
  );
}
