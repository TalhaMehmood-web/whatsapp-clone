import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { ArchivedList } from "@/features/chat/archived-list/archived-list";

export default function ArchivedLayout({ children }) {
  return <SplitPane list={<ArchivedList />}>{children}</SplitPane>;
}
