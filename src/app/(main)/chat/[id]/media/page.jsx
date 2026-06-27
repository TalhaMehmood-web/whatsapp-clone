import { MediaLibraryPage } from "@/features/chat/chat-media-browser/media-library-page";

export default async function ChatMediaPage({ params }) {
  const { id } = await params;
  return <MediaLibraryPage chatId={id} />;
}
