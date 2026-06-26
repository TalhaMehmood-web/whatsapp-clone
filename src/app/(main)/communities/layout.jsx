import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { CommunityList } from "@/features/communities/community-list/community-list";

export default function CommunitiesLayout({ children }) {
  return <SplitPane list={<CommunityList />}>{children}</SplitPane>;
}
