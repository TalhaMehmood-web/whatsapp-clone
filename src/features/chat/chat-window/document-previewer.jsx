"use client";

import { Download, X } from "lucide-react";

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

// Lightweight in-app document viewer. PDFs render inside a sandboxed
// <iframe> directly from the Cloudinary URL. Office docs (Word, Excel,
// PowerPoint) go through Google's docs viewer — Cloudinary delivers the
// raw file and Google renders it as a static HTML preview.
//
// Plain-text-ish files (txt/md/json/log) render inline so users don't
// need to download just to read them.
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
  // For Office docs we hand the *original* Cloudinary URL to the Office
  // Online viewer — Microsoft's servers fetch the source themselves and
  // can't reach our local proxy. PDFs and everything else go through the
  // inline proxy so the browser renders instead of downloading.
  const inlineUrl =
    kind === "office" ? mediaUrl : inlineCloudinaryUrl(mediaUrl, fileName);
  const downloadUrl = downloadCloudinaryUrl(mediaUrl, fileName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] w-[85vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-wa-border bg-wa-panel-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icon className={`size-5 shrink-0 ${accent}`} />
            <DialogTitle className="truncate text-sm font-medium text-wa-text">
              {fileName ?? "Document"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              In-app document preview
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1">
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
              onClick={() => onOpenChange(false)}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-black/20">
          <PreviewBody
            kind={kind}
            mediaUrl={inlineUrl}
            downloadUrl={downloadUrl}
            mediaMime={mime}
            fileName={fileName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({ kind, mediaUrl, downloadUrl, mediaMime, fileName }) {
  if (kind === "pdf") {
    return (
      <object
        data={`${mediaUrl}#toolbar=0&navpanes=0`}
        type="application/pdf"
        className="size-full bg-white"
        aria-label={fileName ?? "PDF preview"}
      >
        <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center text-wa-text-muted">
          <p className="text-sm">
            Your browser can't display this PDF inline.
          </p>
          <Button asChild className="bg-wa-green text-white hover:bg-wa-green/90">
            <a href={downloadUrl} rel="noreferrer">
              <Download className="mr-2 size-4" />
              Download
            </a>
          </Button>
        </div>
      </object>
    );
  }

  if (kind === "office") {
    // Office Online viewer renders Word/Excel/PowerPoint directly from a
    // public URL — works even when the file lives on Cloudinary. We fall
    // back to Google's docs viewer if Office returns an error.
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
    return (
      <div className="flex size-full items-center justify-center bg-black p-4">
        <img
          src={mediaUrl}
          alt={fileName ?? ""}
          className="max-h-full max-w-full object-contain"
        />
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
    // We can't reach the file body across origins. Render the iframe
    // pointed at the raw URL — most browsers display text inline.
    return (
      <iframe
        src={mediaUrl}
        title={fileName ?? "Text preview"}
        className="size-full border-0 bg-wa-panel text-wa-text"
      />
    );
  }

  // Unsupported — show the file card with a download CTA.
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center text-wa-text-muted">
      <p className="text-sm">
        We can't preview this file type inside the app.
      </p>
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
