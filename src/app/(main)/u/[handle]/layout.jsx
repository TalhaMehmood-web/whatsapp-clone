import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { ChatList } from "@/features/chat/chat-list/chat-list";
import { getPublicProfile } from "@/lib/users";
import { absoluteUrl, buildOg } from "@/lib/og-meta";

// Public profile lives inside the (main) shell. We reuse ChatList in the
// left pane so the user can flip back to a conversation without losing
// context. On mobile SplitPane already hides the list when a detail route
// is open (this one is `/u/<handle>` — two segments — so it qualifies).
//
// `generateMetadata` ships the Open Graph + Twitter card tags so a
// shared link previews as `Name — @handle / about line / avatar`
// rather than a bare URL. We render metadata here (not in page.jsx)
// because the page is a client component and metadata exporters only
// run on server components.
export async function generateMetadata({ params }) {
  const { handle } = await params;
  const profile = await getPublicProfile({ viewerId: null, handle });
  if (!profile) {
    return {
      title: "Profile not found",
      robots: { index: false, follow: false },
    };
  }
  return buildOg({
    title: profile.name ?? `@${handle}`,
    description: profile.about ?? `@${profile.handle ?? handle} on WhatsApp`,
    url: await absoluteUrl(`/u/${handle}`),
    image: profile.avatar ?? undefined,
    imageAlt: profile.name ?? undefined,
    type: "profile",
  });
}

export default function PublicProfileLayout({ children }) {
  return <SplitPane list={<ChatList />}>{children}</SplitPane>;
}
