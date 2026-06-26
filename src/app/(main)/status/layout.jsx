import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { StatusList } from "@/features/status/status-list/status-list";

export default function StatusLayout({ children }) {
  return <SplitPane list={<StatusList />}>{children}</SplitPane>;
}
