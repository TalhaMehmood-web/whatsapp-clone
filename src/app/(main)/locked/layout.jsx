import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { LockedChatsList } from "@/features/chat/locked-chats/locked-chats-list";

export default function LockedLayout({ children }) {
  return <SplitPane list={<LockedChatsList />}>{children}</SplitPane>;
}
