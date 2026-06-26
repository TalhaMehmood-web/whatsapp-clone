"use client";

import { Loader2 } from "lucide-react";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { useUpdateChatPrefsMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

const OPTIONS = [
  {
    value: "STANDARD",
    title: "Standard quality",
    description: "Faster to send, smaller file sizes.",
  },
  {
    value: "HD",
    title: "HD quality",
    description: "Best for keeping detail in photos and videos.",
  },
];

export function MediaUploadSubpage() {
  const { data: prefs, isLoading } = useChatPrefsQuery();
  const update = useUpdateChatPrefsMutation();

  if (isLoading || !prefs) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-2 py-3">
      <p className="px-4 pb-2 text-xs text-wa-text-muted">
        {COPY.CHAT_PREFS_MEDIA_UPLOAD_DESC}
      </p>
      <ul className="flex flex-col">
        {OPTIONS.map((opt) => {
          const checked = prefs.mediaUploadQuality === opt.value;
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() =>
                  update.mutate({ mediaUploadQuality: opt.value })
                }
                className={cn(
                  "flex w-full items-center gap-4 rounded-md px-4 py-3 text-left transition-colors hover:bg-wa-panel-2",
                  checked && "bg-wa-panel-2/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border-2",
                    checked ? "border-wa-green" : "border-wa-text-muted",
                  )}
                >
                  {checked && <span className="size-2 rounded-full bg-wa-green" />}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-wa-text">{opt.title}</span>
                  <span className="text-xs text-wa-text-muted">
                    {opt.description}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
