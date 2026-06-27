"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/config/constants";

// One row in the global message-search results. Tapping it deep-links
// into the chat at the matched message via `?msg={id}` — the chat
// detail page reads that param, scrolls the message into view, and
// applies a brief highlight flash so users see what they were looking
// for instead of just dumping them at the top.
//
// We highlight the matched substring inside the snippet so the user
// can see the exact word that matched without re-reading the line.
export function MessageResultRow({ result, query }) {
  const { message, chat } = result;
  const initials = (chat.displayName ?? "??").slice(0, 2).toUpperCase();
  const when = message.createdAt
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
    : "";
  const href = `${ROUTES.CHAT_DETAIL(chat.id)}?msg=${message.id}`;

  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-wa-panel-2"
      >
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={chat.displayPhoto ?? undefined} alt={chat.displayName} />
          <AvatarFallback className="bg-wa-panel-3 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium text-wa-text">
              {chat.displayName}
            </span>
            <span className="shrink-0 text-[11px] text-wa-text-muted">
              {when}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 break-words text-xs text-wa-text-muted">
            {chat.isGroup && message.sender?.name && (
              <span className="text-wa-text">{message.sender.name}: </span>
            )}
            <Highlighted text={message.snippet ?? ""} query={query} />
          </p>
        </div>
      </Link>
    </li>
  );
}

// Wraps every case-insensitive match of `query` inside `text` with a
// green span. Plain DOM — no `dangerouslySetInnerHTML`, no regex on
// untrusted markup. Splits on the matched substring length to render
// each segment as text.
function Highlighted({ text, query }) {
  if (!text || !query) return text;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const out = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx < 0) {
      out.push(text.slice(i));
      break;
    }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <span key={idx} className="rounded bg-wa-green-soft px-0.5 text-wa-green">
        {text.slice(idx, idx + needle.length)}
      </span>,
    );
    i = idx + needle.length;
  }
  return out;
}
