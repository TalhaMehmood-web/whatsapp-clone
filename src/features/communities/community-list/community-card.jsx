"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { previewText } from "@/utils/message-format";
import { COPY, ROUTES } from "@/config/constants";

// One community block: large square photo + name, plus up to 4 nested
// sub-groups with previews. Matches the WhatsApp Web list anatomy.
export function CommunityCard({ entry }) {
  const { community, chats } = entry;
  const initials = (community.name ?? "??").slice(0, 2).toUpperCase();
  const preview = chats.slice(0, 4);

  return (
    <div className="border-b border-wa-border">
      <Link
        href={`${ROUTES.COMMUNITIES}/${community.id}`}
        className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2"
      >
        <Avatar className="size-12 rounded-lg">
          <AvatarImage src={community.photo ?? undefined} alt={community.name} />
          <AvatarFallback className="rounded-lg bg-wa-panel-3 text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] text-wa-text">
            {community.name}
          </span>
          <span className="text-xs text-wa-green">{COPY.COMMUNITIES_VIEW_ALL}</span>
        </div>
      </Link>

      {preview.map((chat) => (
        <Link
          key={chat.id}
          href={ROUTES.CHAT_DETAIL(chat.id)}
          className="flex items-center gap-3 px-3 py-2 pl-6 transition-colors hover:bg-wa-panel-2"
        >
          <Avatar className="size-9 rounded-md">
            <AvatarImage src={chat.photo ?? undefined} alt={chat.name} />
            <AvatarFallback className="rounded-md bg-wa-panel-3 text-[10px]">
              {(chat.name ?? "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-wa-text">{chat.name}</span>
            <span className="truncate text-xs text-wa-text-muted">
              {previewText(chat.lastMessage)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
