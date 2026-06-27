import { CommunityInviteLanding } from "@/features/communities/invite-landing/community-invite-landing";
import { getCommunityByHandle } from "@/lib/communities";
import { absoluteUrl, buildOg } from "@/lib/og-meta";

// `generateMetadata` ships Open Graph + Twitter card tags so a
// /c/{handle} link previews on social with the community photo, name,
// description, and member count. Falls back to a generic "not found"
// set when the handle doesn't resolve.
export async function generateMetadata({ params }) {
  const { handle } = await params;
  const community = await getCommunityByHandle(handle);
  if (!community) {
    return {
      title: "Community not found",
      robots: { index: false, follow: false },
    };
  }
  const memberLabel =
    community.memberCount === 1
      ? "1 member"
      : `${community.memberCount} members`;
  return buildOg({
    title: community.name,
    description:
      community.description ?? `${memberLabel} on WhatsApp Communities`,
    url: await absoluteUrl(`/c/${handle}`),
    image: community.photo ?? undefined,
    imageAlt: community.name,
    type: "website",
  });
}

// Public invite-link landing. /c/{handle} resolves the community by
// its slug and renders a join CTA. Auth is still required to actually
// join — the page just shows the metadata pre-login so the link works
// as a shareable preview on Twitter/LinkedIn etc.
export default async function CommunityInvitePage({ params }) {
  const { handle } = await params;
  return <CommunityInviteLanding handle={handle} />;
}
