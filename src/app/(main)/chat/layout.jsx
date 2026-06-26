import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { ChatList } from "@/features/chat/chat-list/chat-list";
import { GlobalSearchHost } from "@/features/search/global-search/global-search-host";

export default function ChatLayout({ children }) {
  return (
    <SplitPane list={<ChatList />}>
      <GlobalSearchHost>{children}</GlobalSearchHost>
    </SplitPane>
  );
}
