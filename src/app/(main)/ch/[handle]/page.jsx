import { ChannelInviteLanding } from "@/features/channels/invite-landing/channel-invite-landing";
import { getChannelByHandle } from "@/lib/channels";
import { absoluteUrl, buildOg } from "@/lib/og-meta";

// `generateMetadata` ships Open Graph + Twitter card tags so a
// /ch/{handle} link previews on social as Name / description /
// subscriber count / channel photo. Server-side fetch is viewer-less
// (userId: null) because the link is public.
export async function generateMetadata({ params }) {
  const { handle } = await params;
  const channel = await getChannelByHandle({ userId: null, handle });
  if (!channel) {
    return {
      title: "Channel not found",
      robots: { index: false, follow: false },
    };
  }
  const subLabel =
    channel.subscriberCount === 1
      ? "1 subscriber"
      : `${channel.subscriberCount ?? 0} subscribers`;
  return buildOg({
    title: channel.name,
    description: channel.description ?? `${subLabel} on WhatsApp Channels`,
    url: await absoluteUrl(`/ch/${handle}`),
    image: channel.photo ?? undefined,
    imageAlt: channel.name,
    type: "website",
  });
}

// Public invite-link landing for channels. /ch/{handle} returns the
// channel card pre-login so the URL is shareable on social media; the
// Join CTA falls back to /login?next=/ch/{handle} when unauthenticated.
export default async function ChannelInvitePage({ params }) {
  const { handle } = await params;
  return <ChannelInviteLanding handle={handle} />;
}
