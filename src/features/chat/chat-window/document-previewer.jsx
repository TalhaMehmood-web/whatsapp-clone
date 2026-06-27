"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { documentIcon } from "@/utils/document-icon";
import {
  downloadCloudinaryUrl,
  inlineCloudinaryUrl,
} from "@/utils/cloudinary-url";
import { cn } from "@/utils/cn";

// Full-screen in-app document viewer. Replaces the old centred Dialog
// with a real overlay that fills the viewport so PDFs / Office docs /
// images / videos render at a usable size on every device.
//
// Layout:
//   - Top bar: back arrow (left), file icon + name (centre-left),
//              per-kind controls + open-in-new-tab + download + close.
//   - Body: the previewer surface (object / iframe / img / video).
//
// Per-kind controls:
//   - image: zoom in/out, reset, 90° rotate.
//   - pdf, office, text: open in browser tab (lets the user pop out
//     to their own native PDF viewer for find/print/etc.).
//   - audio / video / unsupported: download is the only useful action.
//
// We render through Dialog because the host already mounts it as a
// singleton and we get keyboard-Escape + focus-trap + overlay portal
// for free. The Content slot just overrides the centring transform so
// it fills the viewport.
export function DocumentPreviewer({
  open,
  onOpenChange,
  mediaUrl,
  mediaMime,
  fileName,
}) {
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
  const mime = mediaMime ?? "";
  const { Icon, accent } = documentIcon({ mime, fileName });

  const kind = resolveKind({ mime, ext });
  // Office docs are fetched by Microsoft's servers, so we hand them the
  // original (public) Cloudinary URL. Everything else flows through our
  // inline proxy so the browser renders instead of auto-downloading.
  const inlineUrl =
    kind === "office" ? mediaUrl : inlineCloudinaryUrl(mediaUrl, fileName);
  const downloadUrl = downloadCloudinaryUrl(mediaUrl, fileName);

  // Image-only controls. Reset whenever the previewer reopens so the
  // next document starts fresh.
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    if (open) {
      setScale(1);
      setRotation(0);
    }
  }, [open, mediaUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Fill the viewport. Override the Dialog primitive's centring
          // transform + max-width so the previewer reads as a real
          // full-screen surface, not a fancy modal.
          "fixed inset-0 top-0 left-0 z-50 grid h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_1fr] gap-0 rounded-none border-0 bg-wa-bg p-0 sm:max-w-none",
        )}
      >
        <DialogTitle className="sr-only">
          {fileName ?? "Document preview"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Full-screen in-app document viewer
        </DialogDescription>

        <TopBar
          Icon={Icon}
          accent={accent}
          fileName={fileName}
          kind={kind}
          mediaUrl={mediaUrl}
          downloadUrl={downloadUrl}
          onClose={() => onOpenChange(false)}
          scale={scale}
          onZoomIn={() => setScale((s) => Math.min(s + 0.25, 4))}
          onZoomOut={() => setScale((s) => Math.max(s - 0.25, 0.25))}
          onReset={() => {
            setScale(1);
            setRotation(0);
          }}
          onRotate={() => setRotation((r) => (r + 90) % 360)}
        />

        <div className="min-h-0 overflow-hidden bg-black/20">
          <PreviewBody
            kind={kind}
            mediaUrl={inlineUrl}
            downloadUrl={downloadUrl}
            mediaMime={mime}
            fileName={fileName}
            scale={scale}
            rotation={rotation}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TopBar({
  Icon,
  accent,
  fileName,
  kind,
  mediaUrl,
  downloadUrl,
  onClose,
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onRotate,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-wa-border bg-wa-panel-2 px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Back"
        onClick={onClose}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <ArrowLeft className="size-5" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Icon className={cn("size-5 shrink-0", accent)} />
        <span className="truncate text-sm font-medium text-wa-text">
          {fileName ?? "Document"}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {/* Image-only controls. Skipped for kinds where they'd be a lie
            (an Office doc embed manages its own zoom internally; a PDF
            object uses the browser's native viewer toolbar). */}
        {kind === "image" && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom out"
              onClick={onZoomOut}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <Minus className="size-4" />
            </Button>
            <span className="hidden min-w-12 text-center text-xs text-wa-text-muted sm:block">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom in"
              onClick={onZoomIn}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Rotate 90°"
              onClick={onRotate}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <RotateCw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reset"
              onClick={onReset}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <Maximize2 className="size-4" />
            </Button>
          </>
        )}

        {/* Open in a new browser tab. Routes to the inline-proxy URL so
            the file renders inline rather than triggering a download. */}
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          aria-label="Open in new tab"
          className="text-wa-text-muted hover:text-wa-text"
        >
          <a
            href={inlineCloudinaryUrl(mediaUrl, fileName)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          aria-label="Download"
          className="text-wa-text-muted hover:text-wa-text"
        >
          <a href={downloadUrl} rel="noreferrer">
            <Download className="size-4" />
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={onClose}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <X className="size-5" />
        </Button>
      </div>
    </header>
  );
}

function PreviewBody({
  kind,
  mediaUrl,
  downloadUrl,
  fileName,
  scale,
  rotation,
}) {
  if (kind === "pdf") {
    return (
      <object
        data={`${mediaUrl}#toolbar=0&navpanes=0`}
        type="application/pdf"
        className="size-full bg-white"
        aria-label={fileName ?? "PDF preview"}
      >
        <UnsupportedFallback
          downloadUrl={downloadUrl}
          message="Your browser can't display this PDF inline."
        />
      </object>
    );
  }

  if (kind === "office") {
    // Microsoft's Office Online embed renders Word/Excel/PowerPoint from
    // a public URL. Falls back to a download CTA if Microsoft errors.
    const url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(mediaUrl)}`;
    return (
      <iframe
        src={url}
        title={fileName ?? "Document preview"}
        className="size-full border-0 bg-white"
      />
    );
  }

  if (kind === "image") {
    // Scroll-wraps the image so a zoomed-in photo can be panned with
    // the wheel / touch. Centring via flex inside the scroller keeps
    // the image visually anchored at 100% zoom.
    return (
      <div className="size-full overflow-auto bg-black">
        <div className="flex min-h-full min-w-full items-center justify-center p-4">
          <img
            src={mediaUrl}
            alt={fileName ?? ""}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: "center",
              transition: "transform 120ms ease-out",
            }}
            className="max-h-[calc(100dvh-3.5rem-2rem)] max-w-full select-none object-contain"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="flex size-full items-center justify-center bg-black p-4">
        <video
          src={mediaUrl}
          controls
          autoPlay
          playsInline
          className="max-h-full max-w-full"
        />
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div className="grid size-full place-items-center bg-wa-panel">
        <audio src={mediaUrl} controls className="w-full max-w-md" />
      </div>
    );
  }

  if (kind === "text") {
    return (
      <iframe
        src={mediaUrl}
        title={fileName ?? "Text preview"}
        className="size-full border-0 bg-wa-panel text-wa-text"
      />
    );
  }

  return (
    <UnsupportedFallback
      downloadUrl={downloadUrl}
      message="We can't preview this file type inside the app."
    />
  );
}

function UnsupportedFallback({ downloadUrl, message }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center text-wa-text-muted">
      <p className="text-sm">{message}</p>
      <Button asChild className="bg-wa-green text-white hover:bg-wa-green/90">
        <a href={downloadUrl} rel="noreferrer">
          <Download className="mr-2 size-4" />
          Download
        </a>
      </Button>
    </div>
  );
}

function resolveKind({ mime, ext }) {
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mime.includes("word") ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("presentation") ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(
      ext,
    )
  )
    return "office";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.startsWith("text/") ||
    ["txt", "md", "json", "log", "csv", "xml", "html"].includes(ext)
  )
    return "text";
  return "other";
}
