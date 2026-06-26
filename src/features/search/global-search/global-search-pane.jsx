"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalSearchQuery } from "@/tanstack/search/queries";
import { useStartChatMutation } from "@/tanstack/chat/mutations";
import { chatListTime } from "@/utils/date-format";
import { previewText } from "@/utils/message-format";
import { COPY, ROUTES } from "@/config/constants";

// Detail-pane content shown when the chat-list search bar has a query.
// Two tabs: Messages (full-text across all my chats) and Contacts (peers
// I share a chat with whose name/email/phone matches).
export function GlobalSearchPane({ query }) {
  const { data, isFetching } = useGlobalSearchQuery(query);
  const router = useRouter();
  const start = useStartChatMutation();

  const messages = data?.messages ?? [];
  const contacts = data?.contacts ?? [];

  const startWith = (peer) =>
    start.mutate(peer.id, {
      onSuccess: (chat) => router.push(ROUTES.CHAT_DETAIL(chat.id)),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not open chat"),
    });

  return (
    <div className="flex h-full flex-col bg-wa-bg">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-wa-border bg-wa-panel-2 px-4">
        <div className="flex flex-col">
          <span className="text-sm text-wa-text-muted">
            {COPY.SEARCH_TITLE}
          </span>
          <span className="text-sm font-medium text-wa-text">
            &ldquo;{query}&rdquo;
          </span>
        </div>
        {isFetching && (
          <Loader2 className="size-4 animate-spin text-wa-text-muted" />
        )}
      </header>

      <Tabs defaultValue="messages" className="flex flex-1 flex-col">
        <TabsList className="mt-2 self-center">
          <TabsTrigger value="messages">
            {COPY.SEARCH_TAB_MESSAGES} ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            {COPY.SEARCH_TAB_CONTACTS} ({contacts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="m-0 flex-1">
          <ScrollArea className="h-full">
            {messages.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
                {COPY.SEARCH_NO_RESULTS}
              </p>
            ) : (
              messages.map((msg) => (
                <Link
                  key={msg.id}
                  href={ROUTES.CHAT_DETAIL(msg.chat.id)}
                  className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2"
                >
                  <Avatar className="size-10">
                    <AvatarImage
                      src={
                        (msg.chat.isGroup
                          ? msg.chat.photo
                          : msg.sender?.avatar) ?? undefined
                      }
                      alt=""
                    />
                    <AvatarFallback className="bg-wa-panel-3 text-xs">
                      {(
                        (msg.chat.isGroup
                          ? msg.chat.name
                          : msg.sender?.name) ?? "??"
                      )
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-wa-text">
                        {msg.chat.isGroup ? msg.chat.name : msg.sender?.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-wa-text-muted">
                        {chatListTime(msg.createdAt)}
                      </span>
                    </div>
                    <Highlighted
                      text={previewText(msg)}
                      query={query}
                      className="truncate text-xs text-wa-text-muted"
                    />
                  </div>
                </Link>
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="contacts" className="m-0 flex-1">
          <ScrollArea className="h-full">
            {contacts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
                {COPY.SEARCH_NO_RESULTS}
              </p>
            ) : (
              contacts.map((peer) => (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => startWith(peer)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-wa-panel-2"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
                    <AvatarFallback className="bg-wa-panel-3 text-xs">
                      {(peer.name ?? "??").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-wa-text">
                      {peer.name}
                    </span>
                    <span className="truncate text-xs text-wa-text-muted">
                      {peer.about ?? peer.email ?? peer.phone ?? "—"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Splits `text` on the query and bolds the matching segments.
function Highlighted({ text, query, className }) {
  if (!text || !query) {
    return <span className={className}>{text}</span>;
  }
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="rounded bg-wa-green-soft px-0.5 text-wa-green"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
