import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { ChatList } from "@/features/chat/chat-list/chat-list";

// Public profile lives inside the (main) shell. We reuse ChatList in the
// left pane so the user can flip back to a conversation without losing
// context. On mobile SplitPane already hides the list when a detail route
// is open (this one is `/u/<handle>` — two segments — so it qualifies).
export default function PublicProfileLayout({ children }) {
  return <SplitPane list={<ChatList />}>{children}</SplitPane>;
}
