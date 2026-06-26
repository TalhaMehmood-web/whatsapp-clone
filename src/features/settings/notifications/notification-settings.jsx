"use client";

import { Loader2 } from "lucide-react";
import { Bell, MessageSquare, Circle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { useUpdateChatPrefsMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { SettingsSection } from "@/features/settings/shared/settings-section";
import {
  SettingNavRow,
  SettingToggleRow,
} from "@/features/settings/shared/setting-toggle-row";
import { EnablePushCard } from "@/features/notifications/enable-push-card/enable-push-card";

export function NotificationSettings({ inline = false }) {
  const { data: prefs, isLoading } = useChatPrefsQuery();
  const update = useUpdateChatPrefsMutation();

  if (isLoading || !prefs) {
    return (
      <SettingsSection title={COPY.SETTINGS_NOTIFICATIONS} inline={inline}>
        <div className="flex justify-center py-8 text-wa-text-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const patch = (key) => (value) => update.mutate({ [key]: value });

  return (
    <SettingsSection title={COPY.SETTINGS_NOTIFICATIONS} inline={inline}>
      <EnablePushCard />

      <div className="mt-2">
        <SettingNavRow title={COPY.NOTIF_MESSAGES} value="On" icon={MessageSquare} />
        <SettingNavRow title={COPY.NOTIF_GROUPS} value="On" icon={Bell} />
        <SettingNavRow title={COPY.NOTIF_STATUS} value="On" icon={Circle} />
      </div>

      <Separator className="my-2" />

      <SettingToggleRow
        title={COPY.NOTIF_PREVIEWS}
        description={COPY.NOTIF_PREVIEWS_DESC}
        checked={prefs.showPreviews}
        onChange={patch("showPreviews")}
      />
      <SettingToggleRow
        title={COPY.NOTIF_SOUNDS}
        checked={prefs.outgoingSounds}
        onChange={patch("outgoingSounds")}
      />

      <Separator className="my-2" />

      <SettingToggleRow
        title={COPY.NOTIF_BG_SYNC}
        description={COPY.NOTIF_BG_SYNC_DESC}
        checked={prefs.backgroundSync}
        onChange={patch("backgroundSync")}
      />
    </SettingsSection>
  );
}
