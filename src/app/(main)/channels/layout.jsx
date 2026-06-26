import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { ChannelList } from "@/features/channels/channel-list/channel-list";

export default function ChannelsLayout({ children }) {
  return <SplitPane list={<ChannelList />}>{children}</SplitPane>;
}
