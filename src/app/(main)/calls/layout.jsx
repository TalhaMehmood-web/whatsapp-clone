import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { CallList } from "@/features/calls/call-list/call-list";

export default function CallsLayout({ children }) {
  return <SplitPane list={<CallList />}>{children}</SplitPane>;
}
