"use client";

import { useUiStore } from "@/stores/ui-store";
import { DocumentPreviewer } from "./document-previewer";

// Singleton host mounted at the (main) layout. Any bubble or media
// browser row can call `openDocPreview({ mediaUrl, mediaMime, fileName })`
// and this component will render the preview modal.
export function DocumentPreviewerHost() {
  const doc = useUiStore((s) => s.docPreview);
  const close = useUiStore((s) => s.closeDocPreview);
  return (
    <DocumentPreviewer
      open={!!doc}
      onOpenChange={(v) => !v && close()}
      mediaUrl={doc?.mediaUrl}
      mediaMime={doc?.mediaMime}
      fileName={doc?.fileName}
    />
  );
}
