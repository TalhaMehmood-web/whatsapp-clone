"use client";

import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  MoreVertical,
  Star,
  Tag,
  UsersRound,
  LogOut,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/tanstack/auth/mutations";
import { COPY, ROUTES } from "@/config/constants";
import { useUiStore } from "@/stores/ui-store";

export function ChatListHeader() {
  const router = useRouter();
  const { mutate: logout } = useLogoutMutation();
  // New-chat / new-group modal state is in the global store so the
  // keyboard shortcuts can flip the modals open from anywhere — not just
  // when this header is mounted.
  const openLabels = useUiStore((s) => s.openManageLabels);
  const openNewChat = useUiStore((s) => s.openNewChat);
  const openNewGroup = useUiStore((s) => s.openNewGroup);

  return (
    <>
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">{COPY.APP_NAME}</h1>
        <div className="flex items-center gap-1 text-wa-text-muted">
          <Button
            variant="ghost"
            size="icon"
            aria-label={COPY.NEW_CHAT}
            onClick={openNewChat}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <MessageSquarePlus className="size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More"
                className="text-wa-text-muted hover:text-wa-text"
              >
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={openNewChat}>
                <MessageSquarePlus className="mr-2 size-4" /> {COPY.NEW_CHAT}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openNewGroup}>
                <UsersRound className="mr-2 size-4" /> {COPY.NEW_GROUP}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserRoundPlus className="mr-2 size-4" /> {COPY.NEW_COMMUNITY}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openLabels}>
                <Tag className="mr-2 size-4" /> {COPY.LABELS_TITLE}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(ROUTES.STARRED)}>
                <Star className="mr-2 size-4" /> {COPY.STARRED_MESSAGES}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-wa-danger focus:text-wa-danger"
                onClick={() =>
                  logout(undefined, {
                    onSuccess: () => router.replace(ROUTES.LOGIN),
                  })
                }
              >
                <LogOut className="mr-2 size-4" /> {COPY.LOG_OUT}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

    </>
  );
}
