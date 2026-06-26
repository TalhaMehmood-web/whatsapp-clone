import { AuthGuard } from "@/features/auth/shared/auth-guard";
import { NavRail } from "@/features/layout/nav-rail/nav-rail";
import { BottomTabBar } from "@/features/layout/bottom-tab-bar/bottom-tab-bar";
import { SocketBoundary } from "@/features/realtime/socket-boundary";
import { ManageLabelsHost } from "@/features/chat/labels/manage-labels-host";
import { KeyboardShortcutsHost } from "@/features/settings/keyboard-shortcuts/keyboard-shortcuts-host";
import { IncomingCallHost } from "@/features/calls/incoming-call/incoming-call-modal";
import { ForwardModalHost } from "@/features/chat/chat-window/forward-modal";
import { MediaLightboxHost } from "@/features/chat/media-lightbox/media-lightbox";
import { EditMessageDialogHost } from "@/features/chat/chat-window/edit-message-dialog";
import { DocumentPreviewerHost } from "@/features/chat/chat-window/document-previewer-host";

export default function MainLayout({ children }) {
  return (
    <AuthGuard>
      <SocketBoundary>
        <div className="flex h-dvh w-screen flex-col overflow-hidden md:flex-row">
          <NavRail />
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {children}
          </div>
          <BottomTabBar />
        </div>
        <ManageLabelsHost />
        <KeyboardShortcutsHost />
        <IncomingCallHost />
        <ForwardModalHost />
        <MediaLightboxHost />
        <EditMessageDialogHost />
        <DocumentPreviewerHost />
      </SocketBoundary>
    </AuthGuard>
  );
}
