"use client";

import { Loader2 } from "lucide-react";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { useUpdateChatPrefsMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { SettingToggleRow } from "@/features/settings/shared/setting-toggle-row";

export function MediaAutoDownloadSubpage() {
  const { data: prefs, isLoading } = useChatPrefsQuery();
  const update = useUpdateChatPrefsMutation();

  if (isLoading || !prefs) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const patch = (key) => (value) => update.mutate({ [key]: value });

  return (
    <div className="py-2">
      <p className="px-6 pb-2 text-xs text-wa-text-muted">
        {COPY.CHAT_PREFS_MEDIA_AUTODL_DESC}
      </p>
      <SettingToggleRow
        title={COPY.CHAT_PREFS_AUTODL_PHOTOS}
        checked={prefs.autoDownloadPhotos}
        onChange={patch("autoDownloadPhotos")}
      />
      <SettingToggleRow
        title={COPY.CHAT_PREFS_AUTODL_VIDEOS}
        checked={prefs.autoDownloadVideos}
        onChange={patch("autoDownloadVideos")}
      />
      <SettingToggleRow
        title={COPY.CHAT_PREFS_AUTODL_DOCS}
        checked={prefs.autoDownloadDocs}
        onChange={patch("autoDownloadDocs")}
      />
    </div>
  );
}
