import { StatusViewer } from "@/features/status/status-viewer/status-viewer";

export default async function StatusViewerPage({ params }) {
  const { authorId } = await params;
  return <StatusViewer authorId={authorId} />;
}
