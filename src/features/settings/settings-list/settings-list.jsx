"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CircleHelp,
  KeyRound,
  Keyboard,
  Lock,
  LogOut,
  MessageCircle,
  Search,
  User,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLogoutMutation } from "@/tanstack/auth/mutations";
import { COPY, ROUTES } from "@/config/constants";
import { useUiStore } from "@/stores/ui-store";
import { SettingsRow } from "./settings-row";
import { SettingsPaneRouter } from "./settings-pane-router";

export function SettingsList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { mutate: logout } = useLogoutMutation();
  const openShortcuts = useUiStore((s) => s.openKeyboardShortcuts);
  const pushPane = useUiStore((s) => s.pushSettingsPane);

  const sections = useMemo(
    () => [
      {
        icon: User,
        title: COPY.SETTINGS_PROFILE,
        description: COPY.SETTINGS_PROFILE_DESC,
        onClick: () => pushPane("profile"),
      },
      {
        icon: KeyRound,
        title: COPY.SETTINGS_ACCOUNT,
        description: COPY.SETTINGS_ACCOUNT_DESC,
        onClick: () => pushPane("account"),
      },
      {
        icon: Lock,
        title: COPY.SETTINGS_PRIVACY,
        description: COPY.SETTINGS_PRIVACY_DESC,
        onClick: () => pushPane("privacy"),
      },
      {
        icon: MessageCircle,
        title: COPY.SETTINGS_CHATS,
        description: COPY.SETTINGS_CHATS_DESC,
        onClick: () => pushPane("chats"),
      },
      {
        icon: Bell,
        title: COPY.SETTINGS_NOTIFICATIONS,
        description: COPY.SETTINGS_NOTIFICATIONS_DESC,
        onClick: () => pushPane("notifications"),
      },
      {
        icon: Keyboard,
        title: COPY.SETTINGS_SHORTCUTS,
        description: COPY.SETTINGS_SHORTCUTS_DESC,
        onClick: openShortcuts,
        chevron: false,
      },
      {
        icon: CircleHelp,
        title: COPY.SETTINGS_HELP,
        description: COPY.SETTINGS_HELP_DESC,
        href: "/settings/help",
      },
    ],
    [openShortcuts, pushPane],
  );

  const filtered = sections.filter((s) =>
    s.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.SETTINGS_TITLE}
        </h1>
      </header>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={COPY.SETTINGS_SEARCH}
            className="h-9 rounded-full border-0 bg-wa-panel-2 pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.map((s) => (
          <SettingsRow key={s.title} {...s} />
        ))}

        <Separator className="my-2" />
        <SettingsRow
          icon={LogOut}
          title={COPY.LOG_OUT}
          destructive
          chevron={false}
          onClick={() =>
            logout(undefined, {
              onSuccess: () => router.replace(ROUTES.LOGIN),
            })
          }
        />
      </ScrollArea>

      <SettingsPaneRouter />
    </div>
  );
}
