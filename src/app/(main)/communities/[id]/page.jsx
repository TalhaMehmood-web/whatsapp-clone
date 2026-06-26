import { CommunityDetail } from "@/features/communities/community-detail/community-detail";

export default async function CommunityDetailPage({ params }) {
  const { id } = await params;
  return <CommunityDetail id={id} />;
}
