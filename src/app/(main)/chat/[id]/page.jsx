import { Suspense } from "react";
import { ChatHeader } from "@/features/chat/chat-window/chat-header";
import { ChatSearchBar } from "@/features/chat/chat-window/chat-search-bar";
import { ChatWallpaper } from "@/features/chat/chat-window/chat-wallpaper";
import { MessageList } from "@/features/chat/chat-window/message-list";
import { ChatBottomBar } from "@/features/chat/chat-window/chat-bottom-bar";
import { ChatRoomPresence } from "@/features/chat/chat-window/chat-room-presence";
import { PinnedMessageBanner } from "@/features/chat/chat-window/pinned-message-banner";
import { MessageDeepLinkScroller } from "@/features/chat/chat-window/message-deep-link-scroller";

export default async function ChatDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="flex h-full flex-col">
      <ChatRoomPresence chatId={id} />
      <ChatHeader chatId={id} />
      <ChatSearchBar chatId={id} />
      <PinnedMessageBanner chatId={id} />
      <ChatWallpaper>
        <MessageList chatId={id} />
      </ChatWallpaper>
      <ChatBottomBar chatId={id} />
      {/* Reads `?msg=` from the URL and scrolls + flashes the matching
          bubble. Used by the global search results to deep-link into
          a specific message. Wrapped in Suspense because
          useSearchParams suspends during render in client comps under
          App Router. */}
      <Suspense fallback={null}>
        <MessageDeepLinkScroller />
      </Suspense>
    </div>
  );
}
