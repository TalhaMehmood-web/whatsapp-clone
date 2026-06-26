"use client";

import { Loader2 } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import {
  useChatPrefsQuery,
  useNotifPrefsQuery,
} from "@/tanstack/users/queries";
import {
  useUpdateChatPrefsMutation,
  useUpdateNotifPrefsMutation,
} from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import {
  SettingsGroupLabel,
  SettingsSection,
} from "@/features/settings/shared/settings-section";
import { SettingToggleRow } from "@/features/settings/shared/setting-toggle-row";
import { EnablePushCard } from "@/features/notifications/enable-push-card/enable-push-card";

// The screen reads from two cached rows:
//
// - notifPrefs (server-enforced) — Messages / Groups / Status / reaction
//   sounds. Toggling these gates whether the recipient gets the push at
//   all. Wire enforcement lives in lib/messages.js → pushToPeers().
//
// - chatPrefs (local-effect) — preview text, outgoing send sound,
//   background sync. These predate notifPrefs and only affect the
//   on-device experience; moving them would force a no-op data migration
//   so we keep them where they are.
export function NotificationSettings({ inline = false }) {
  const { data: notif, isLoading: notifLoading } = useNotifPrefsQuery();
  const { data: prefs, isLoading: prefsLoading } = useChatPrefsQuery();
  const updateNotif = useUpdateNotifPrefsMutation();
  const updatePrefs = useUpdateChatPrefsMutation();

  if (notifLoading || prefsLoading || !notif || !prefs) {
    return (
      <SettingsSection title={COPY.SETTINGS_NOTIFICATIONS} inline={inline}>
        <div className="flex justify-center py-8 text-wa-text-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const patchNotif = (key) => (value) => updateNotif.mutate({ [key]: value });
  const patchPrefs = (key) => (value) => updatePrefs.mutate({ [key]: value });

  return (
    <SettingsSection title={COPY.SETTINGS_NOTIFICATIONS} inline={inline}>
      <EnablePushCard />

      <SettingsGroupLabel>{COPY.NOTIF_KIND_LABEL}</SettingsGroupLabel>
      <SettingToggleRow
        title={COPY.NOTIF_MESSAGES}
        description={COPY.NOTIF_MESSAGES_DESC}
        checked={notif.messages}
        onChange={patchNotif("messages")}
      />
      <SettingToggleRow
        title={COPY.NOTIF_GROUPS}
        description={COPY.NOTIF_GROUPS_DESC}
        checked={notif.groups}
        onChange={patchNotif("groups")}
      />
      <SettingToggleRow
        title={COPY.NOTIF_STATUS}
        description={COPY.NOTIF_STATUS_DESC}
        checked={notif.status}
        onChange={patchNotif("status")}
      />
      <SettingToggleRow
        title={COPY.NOTIF_REACTION_SOUNDS}
        description={COPY.NOTIF_REACTION_SOUNDS_DESC}
        checked={notif.reactionSounds}
        onChange={patchNotif("reactionSounds")}
      />

      <Separator className="my-2" />
      <SettingsGroupLabel>{COPY.NOTIF_ON_DEVICE_LABEL}</SettingsGroupLabel>
      <SettingToggleRow
        title={COPY.NOTIF_PREVIEWS}
        description={COPY.NOTIF_PREVIEWS_DESC}
        checked={prefs.showPreviews}
        onChange={patchPrefs("showPreviews")}
      />
      <SettingToggleRow
        title={COPY.NOTIF_SOUNDS}
        checked={prefs.outgoingSounds}
        onChange={patchPrefs("outgoingSounds")}
      />
      <SettingToggleRow
        title={COPY.NOTIF_BG_SYNC}
        description={COPY.NOTIF_BG_SYNC_DESC}
        checked={prefs.backgroundSync}
        onChange={patchPrefs("backgroundSync")}
      />
    </SettingsSection>
  );
}
