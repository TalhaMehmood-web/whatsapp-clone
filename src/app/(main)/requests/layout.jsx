import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { RequestsPageList } from "@/features/requests/requests-page/requests-page-list";

export default function RequestsLayout({ children }) {
  return <SplitPane list={<RequestsPageList />}>{children}</SplitPane>;
}
