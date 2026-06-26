import { ChannelDetail } from "@/features/channels/channel-detail/channel-detail";

export default async function ChannelDetailPage({ params }) {
  const { id } = await params;
  return <ChannelDetail id={id} />;
}
