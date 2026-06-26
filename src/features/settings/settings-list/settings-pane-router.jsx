"use client";

import { Loader2 } from "lucide-react";

import { SlidePane } from "@/features/layout/slide-pane/slide-pane";
import { useUiStore } from "@/stores/ui-store";
import { ProfileEditor } from "@/features/settings/profile/profile-editor";
import { AccountSettings } from "@/features/settings/account/account-settings";
import { PrivacySettings } from "@/features/settings/privacy/privacy-settings";
import { ChatSettings } from "@/features/settings/chats/chat-settings";
import { WallpaperSubpage } from "@/features/settings/chats/wallpaper-subpage";
import { MediaUploadSubpage } from "@/features/settings/chats/media-upload-subpage";
import { MediaAutoDownloadSubpage } from "@/features/settings/chats/media-autodl-subpage";
import { NotificationSettings } from "@/features/settings/notifications/notification-settings";
import { VisibilityScopeSubpage } from "@/features/settings/privacy/visibility-scope-subpage";
import {
  usePrivacyQuery,
} from "@/tanstack/users/queries";
import {
  useUpdatePrivacyMutation,
} from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { VisibilityScope } from "@/models/enums";

// Maps a settings-pane stack id to the panel's title + content. Used by the
// settings list to render the SlidePane stack on top of itself.
//
// Ids are flat strings; nested pages use a "parent:child" namespace
// (e.g. "privacy:lastSeen"). When `privacy:*` is open, both the Privacy
// pane and the scope detail render — `getStack()` returns the full chain.
export function SettingsPaneRouter() {
  const stack = useUiStore((s) => s.settingsPane);
  const pop = useUiStore((s) => s.popSettingsPane);

  return (
    <>
      {stack.map((id, index) => (
        <SettingsPaneFrame
          key={id}
          id={id}
          open
          // Only the *topmost* pane reacts to the back arrow.
          onClose={index === stack.length - 1 ? pop : undefined}
        />
      ))}
    </>
  );
}

function SettingsPaneFrame({ id, open, onClose }) {
  const node = renderPane(id);
  if (!node) return null;
  return (
    <SlidePane open={open} title={node.title} onClose={onClose}>
      {node.body}
    </SlidePane>
  );
}

function renderPane(id) {
  switch (id) {
    case "profile":
      return { title: COPY.PROFILE_EDIT_TITLE, body: <ProfileEditor inline /> };
    case "account":
      return { title: COPY.SETTINGS_ACCOUNT, body: <AccountSettings inline /> };
    case "privacy":
      return { title: COPY.SETTINGS_PRIVACY, body: <PrivacySettings inline /> };
    case "chats":
      return { title: COPY.SETTINGS_CHATS, body: <ChatSettings inline /> };
    case "notifications":
      return {
        title: COPY.SETTINGS_NOTIFICATIONS,
        body: <NotificationSettings inline />,
      };
    case "chats:wallpaper":
      return { title: COPY.CHAT_PREFS_WALLPAPER, body: <WallpaperSubpage /> };
    case "chats:mediaUpload":
      return {
        title: COPY.CHAT_PREFS_MEDIA_UPLOAD,
        body: <MediaUploadSubpage />,
      };
    case "chats:mediaAutoDl":
      return {
        title: COPY.CHAT_PREFS_MEDIA_AUTODL,
        body: <MediaAutoDownloadSubpage />,
      };
    case "privacy:lastSeen":
      return { title: COPY.PRIVACY_LAST_SEEN, body: <LastSeenSubpage /> };
    case "privacy:profilePhoto":
      return {
        title: COPY.PRIVACY_PROFILE_PHOTO,
        body: <SingleScopeSubpage field="profilePhoto" title={COPY.PRIVACY_WHO_CAN_SEE_PROFILE_PHOTO} />,
      };
    case "privacy:about":
      return {
        title: COPY.PRIVACY_ABOUT,
        body: <SingleScopeSubpage field="about" title={COPY.PRIVACY_WHO_CAN_SEE_ABOUT} />,
      };
    case "privacy:status":
      return {
        title: COPY.PRIVACY_STATUS,
        body: <SingleScopeSubpage field="status" title={COPY.PRIVACY_WHO_CAN_SEE_STATUS} />,
      };
    case "privacy:groups":
      return {
        title: COPY.PRIVACY_GROUPS,
        body: <SingleScopeSubpage field="groupsPolicy" title={COPY.PRIVACY_GROUPS} />,
      };
    default:
      return null;
  }
}

// Two-radio-group layout for Last seen + online presence visibility. The
// "When I'm online" group has a special `SAME_AS_LAST_SEEN` option that
// mirrors whatever the last-seen scope was set to.
function LastSeenSubpage() {
  const { data: privacy, isLoading } = usePrivacyQuery();
  const update = useUpdatePrivacyMutation();

  if (isLoading || !privacy) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <VisibilityScopeSubpage
      hint={COPY.PRIVACY_LAST_SEEN_HINT}
      groups={[
        {
          title: COPY.PRIVACY_WHO_CAN_SEE_LAST_SEEN,
          value: privacy.lastSeen,
          onChange: (scope) => update.mutate({ lastSeen: scope }),
        },
        {
          title: COPY.PRIVACY_WHO_CAN_SEE_ONLINE,
          // Two options only on this group — matches WhatsApp Web.
          options: [VisibilityScope.EVERYONE, "SAME_AS_LAST_SEEN"],
          labels: {
            [VisibilityScope.EVERYONE]: "Everyone",
            SAME_AS_LAST_SEEN: COPY.PRIVACY_SAME_AS_LAST_SEEN,
          },
          // We model "same as last seen" by leaving the canonical scope
          // alone; the value matches when no override is in play.
          value:
            privacy.onlineMatchesLastSeen ?? "SAME_AS_LAST_SEEN",
          onChange: (scope) =>
            update.mutate({ onlineMatchesLastSeen: scope }),
        },
      ]}
    />
  );
}

function SingleScopeSubpage({ field, title }) {
  const { data: privacy, isLoading } = usePrivacyQuery();
  const update = useUpdatePrivacyMutation();
  if (isLoading || !privacy) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  return (
    <VisibilityScopeSubpage
      groups={[
        {
          title,
          value: privacy[field],
          onChange: (scope) => update.mutate({ [field]: scope }),
        },
      ]}
    />
  );
}
