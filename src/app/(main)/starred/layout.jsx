import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { StarredMessagesList } from "@/features/chat/starred-messages/starred-messages";

export default function StarredLayout({ children }) {
  return <SplitPane list={<StarredMessagesList />}>{children}</SplitPane>;
}
