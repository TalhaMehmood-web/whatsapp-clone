import { GroupInviteLanding } from "@/features/groups/invite-landing/group-invite-landing";
import { getGroupByInviteHandle } from "@/lib/group-invites";
import { absoluteUrl, buildOg } from "@/lib/og-meta";

// OG metadata for /g/{handle} — same pattern as /c/{handle} and
// /ch/{handle}. Falls back to a generic not-found set when the invite
// link has been revoked or never existed.
export async function generateMetadata({ params }) {
  const { handle } = await params;
  const group = await getGroupByInviteHandle(handle);
  if (!group) {
    return {
      title: "Group not found",
      robots: { index: false, follow: false },
    };
  }
  const memberLabel =
    group.memberCount === 1 ? "1 member" : `${group.memberCount} members`;
  return buildOg({
    title: group.name ?? "Group",
    description: group.description ?? `${memberLabel} on WhatsApp`,
    url: await absoluteUrl(`/g/${handle}`),
    image: group.photo ?? undefined,
    imageAlt: group.name ?? "Group",
    type: "website",
  });
}

// Public invite-link landing for a group chat. Visitors see the card
// pre-login; clicking Join bounces through /login?next=/g/{handle}
// when unauthenticated.
export default async function GroupInvitePage({ params }) {
  const { handle } = await params;
  return <GroupInviteLanding handle={handle} />;
}
