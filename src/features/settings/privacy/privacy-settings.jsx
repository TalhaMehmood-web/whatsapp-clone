"use client";

import { useState } from "react";
import { Loader2, ShieldX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  usePrivacyQuery,
  useBlockedUsersQuery,
} from "@/tanstack/users/queries";
import { useUpdatePrivacyMutation } from "@/tanstack/users/mutations";
import { useUiStore } from "@/stores/ui-store";
import { COPY } from "@/config/constants";
import { VisibilityScope } from "@/models/enums";
import {
  SettingsSection,
  SettingsGroupLabel,
} from "@/features/settings/shared/settings-section";
import {
  SettingNavRow,
  SettingToggleRow,
} from "@/features/settings/shared/setting-toggle-row";
import { BlockedContactsSheet } from "./blocked-contacts-sheet";

const SCOPE_LABEL = {
  [VisibilityScope.EVERYONE]: "Everyone",
  [VisibilityScope.CONTACTS]: "My contacts",
  [VisibilityScope.CONTACTS_EXCEPT]: "My contacts except…",
  [VisibilityScope.NOBODY]: "Nobody",
};

export function PrivacySettings({ inline = false }) {
  const { data: privacy, isLoading } = usePrivacyQuery();
  const { data: blocked } = useBlockedUsersQuery();
  const update = useUpdatePrivacyMutation();
  const pushPane = useUiStore((s) => s.pushSettingsPane);
  const [blockedOpen, setBlockedOpen] = useState(false);

  if (isLoading || !privacy) {
    return (
      <SettingsSection title={COPY.SETTINGS_PRIVACY} inline={inline}>
        <div className="flex justify-center py-8 text-wa-text-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const patch = (key) => (value) => update.mutate({ [key]: value });
  const scopeRow = (title, field, paneId) => (
    <SettingNavRow
      title={title}
      value={SCOPE_LABEL[privacy[field]] ?? "Not set"}
      onClick={() => pushPane(paneId)}
    />
  );

  return (
    <SettingsSection title={COPY.SETTINGS_PRIVACY} inline={inline}>
      <SettingsGroupLabel>{COPY.PRIVACY_PERSONAL}</SettingsGroupLabel>
      {scopeRow(COPY.PRIVACY_LAST_SEEN, "lastSeen", "privacy:lastSeen")}
      {scopeRow(COPY.PRIVACY_PROFILE_PHOTO, "profilePhoto", "privacy:profilePhoto")}
      {scopeRow(COPY.PRIVACY_ABOUT, "about", "privacy:about")}
      {scopeRow(COPY.PRIVACY_STATUS, "status", "privacy:status")}

      <Separator className="my-2" />

      <SettingToggleRow
        title={COPY.PRIVACY_READ_RECEIPTS}
        description={COPY.PRIVACY_READ_RECEIPTS_HINT}
        checked={privacy.readReceipts}
        onChange={patch("readReceipts")}
      />

      <Separator className="my-2" />
      <SettingsGroupLabel>{COPY.PRIVACY_DISAPPEARING_TITLE}</SettingsGroupLabel>
      <div className="px-6 py-3">
        <p className="text-sm text-wa-text">{COPY.PRIVACY_DEFAULT_TIMER}</p>
        <p className="text-xs text-wa-text-muted">
          {privacy.defaultDisappearing
            ? `${privacy.defaultDisappearing}s`
            : "Off"}
        </p>
      </div>

      <Separator className="my-2" />
      {scopeRow(COPY.PRIVACY_GROUPS, "groupsPolicy", "privacy:groups")}

      <Separator className="my-2" />
      <SettingNavRow
        icon={ShieldX}
        title={COPY.BLOCKED_CONTACTS}
        value={
          (blocked?.length ?? 0) > 0
            ? `${blocked.length} contact${blocked.length === 1 ? "" : "s"}`
            : COPY.BLOCKED_EMPTY
        }
        onClick={() => setBlockedOpen(true)}
      />

      <SettingToggleRow
        title={COPY.PRIVACY_APP_LOCK}
        description={COPY.PRIVACY_APP_LOCK_DESC}
        checked={privacy.appLockEnabled}
        onChange={patch("appLockEnabled")}
      />

      <Separator className="my-2" />
      <SettingsGroupLabel>{COPY.PRIVACY_ADVANCED}</SettingsGroupLabel>
      <SettingToggleRow
        title={COPY.PRIVACY_BLOCK_UNKNOWN}
        description={COPY.PRIVACY_BLOCK_UNKNOWN_DESC}
        checked={privacy.blockUnknownMessages}
        onChange={patch("blockUnknownMessages")}
      />
      <SettingToggleRow
        title={COPY.PRIVACY_LINK_PREVIEWS}
        description={COPY.PRIVACY_LINK_PREVIEWS_DESC}
        checked={!privacy.linkPreviews}
        onChange={(value) => update.mutate({ linkPreviews: !value })}
      />

      <BlockedContactsSheet
        open={blockedOpen}
        onOpenChange={setBlockedOpen}
      />
    </SettingsSection>
  );
}
