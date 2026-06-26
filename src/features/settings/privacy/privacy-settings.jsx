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
import {
  DisappearingDefaultDialog,
  formatDisappearingDefault,
} from "./disappearing-default-dialog";

const SCOPE_LABEL = {
  [VisibilityScope.EVERYONE]: "Everyone",
  [VisibilityScope.CONTACTS]: "My contacts",
  [VisibilityScope.CONTACTS_EXCEPT]: "My contacts except…",
  [VisibilityScope.NOBODY]: "Nobody",
};

// When the scope is CONTACTS_EXCEPT, the Privacy index row shows the
// excluded-count instead of the generic label so users can see at a
// glance how many contacts they've hidden from.
function scopeSublabel(privacy, field) {
  const scope = privacy[field];
  if (scope !== VisibilityScope.CONTACTS_EXCEPT) {
    return SCOPE_LABEL[scope] ?? "Not set";
  }
  const count = privacy.privacyExceptions?.[field]?.length ?? 0;
  return `${count} ${count === 1 ? "contact" : "contacts"} excluded`;
}

export function PrivacySettings({ inline = false }) {
  const { data: privacy, isLoading } = usePrivacyQuery();
  const { data: blocked } = useBlockedUsersQuery();
  const update = useUpdatePrivacyMutation();
  const pushPane = useUiStore((s) => s.pushSettingsPane);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [disappearingOpen, setDisappearingOpen] = useState(false);

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
      value={scopeSublabel(privacy, field)}
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
      <SettingNavRow
        title={COPY.PRIVACY_DEFAULT_TIMER}
        value={formatDisappearingDefault(privacy.defaultDisappearing)}
        onClick={() => setDisappearingOpen(true)}
      />

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
        description={COPY.PRIVACY_APP_LOCK_COMING}
        checked={false}
        onChange={() => {}}
        disabled
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
      <DisappearingDefaultDialog
        open={disappearingOpen}
        onOpenChange={setDisappearingOpen}
      />
    </SettingsSection>
  );
}
