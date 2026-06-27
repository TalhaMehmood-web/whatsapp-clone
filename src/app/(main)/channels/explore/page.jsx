import { ChannelsExplorePage } from "@/features/channels/explore/channels-explore-page";

// /channels/explore — discover surface. Renders in the detail pane
// position via the channels layout's SplitPane, so on desktop the
// chat list stays visible alongside.
export default function ChannelsExploreRoute() {
  return <ChannelsExplorePage />;
}
