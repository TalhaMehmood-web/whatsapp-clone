"use client";

import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { useUpdateChatPrefsMutation } from "@/tanstack/users/mutations";
import { useUiStore } from "@/stores/ui-store";
import { COPY } from "@/config/constants";
import {
  SettingsSection,
  SettingsGroupLabel,
} from "@/features/settings/shared/settings-section";
import {
  SettingNavRow,
  SettingToggleRow,
} from "@/features/settings/shared/setting-toggle-row";
import { ThemeRow } from "./theme-row";

export function ChatSettings({ inline = false }) {
  const { data: prefs, isLoading } = useChatPrefsQuery();
  const update = useUpdateChatPrefsMutation();
  const pushPane = useUiStore((s) => s.pushSettingsPane);

  if (isLoading || !prefs) {
    return (
      <SettingsSection title={COPY.SETTINGS_CHATS} inline={inline}>
        <div className="flex justify-center py-8 text-wa-text-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const patch = (key) => (value) => update.mutate({ [key]: value });

  return (
    <SettingsSection title={COPY.SETTINGS_CHATS} inline={inline}>
      <SettingsGroupLabel>{COPY.CHAT_PREFS_DISPLAY}</SettingsGroupLabel>
      <ThemeRow />
      <SettingNavRow
        title={COPY.CHAT_PREFS_WALLPAPER}
        value={prefs.wallpaperUrl ? "Custom" : COPY.WALLPAPER_DEFAULT}
        onClick={() => pushPane("chats:wallpaper")}
      />

      <Separator className="my-2" />
      <SettingsGroupLabel>{COPY.CHAT_PREFS_SETTINGS}</SettingsGroupLabel>
      <SettingNavRow
        title={COPY.CHAT_PREFS_MEDIA_UPLOAD}
        value={prefs.mediaUploadQuality === "HD" ? "HD quality" : "Standard quality"}
        onClick={() => pushPane("chats:mediaUpload")}
      />
      <SettingNavRow
        title={COPY.CHAT_PREFS_MEDIA_AUTODL}
        value={`Photos ${prefs.autoDownloadPhotos ? "On" : "Off"} · Videos ${
          prefs.autoDownloadVideos ? "On" : "Off"
        }`}
        onClick={() => pushPane("chats:mediaAutoDl")}
      />

      <SettingToggleRow
        title={COPY.CHAT_PREFS_SPELL_CHECK}
        description={COPY.CHAT_PREFS_SPELL_CHECK_DESC}
        checked={prefs.spellCheck}
        onChange={patch("spellCheck")}
      />
      <SettingToggleRow
        title={COPY.CHAT_PREFS_REPLACE_EMOJI}
        description={COPY.CHAT_PREFS_REPLACE_EMOJI_DESC}
        checked={prefs.replaceTextWithEmoji}
        onChange={patch("replaceTextWithEmoji")}
      />
      <SettingToggleRow
        title={COPY.CHAT_PREFS_ENTER_SEND}
        description={COPY.CHAT_PREFS_ENTER_SEND_DESC}
        checked={prefs.enterIsSend}
        onChange={patch("enterIsSend")}
      />
    </SettingsSection>
  );
}
