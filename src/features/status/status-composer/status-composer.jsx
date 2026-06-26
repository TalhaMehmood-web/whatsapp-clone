"use client";

import { useSearchParams } from "next/navigation";
import { StatusComposerText } from "./status-composer-text";
import { StatusComposerMedia } from "./status-composer-media";

// Routes to the right composer based on the `type` search param.
//   ?type=text  -> text composer (default)
//   ?type=media -> photo/video composer
export function StatusComposer() {
  const params = useSearchParams();
  const type = params.get("type") ?? "text";
  return type === "media" ? <StatusComposerMedia /> : <StatusComposerText />;
}
