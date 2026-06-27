"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Camera, FileText, Image as ImageIcon, Paperclip, UserPlus, BarChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { MessageType } from "@/models/enums";

// Plus-attach button next to the message input. Each item opens the relevant
// file picker via useMediaUpload. Contact + Poll are stubbed for now (later
// phases will wire them up).
export function AttachMenu({ chatId }) {
  const doc = useMediaUpload(chatId, { kind: MessageType.DOCUMENT });
  const photo = useMediaUpload(chatId, {
    kind: MessageType.IMAGE,
    accept: "image/*,video/*",
  });
  const camera = useMediaUpload(chatId, {
    kind: MessageType.IMAGE,
    accept: "image/*;capture=camera",
  });

  // Auto-open the right picker when the user landed here via the
  // empty-pane "Send document" pill (or any future intent). Strip the
  // param once consumed so a manual back/forward doesn't re-fire it.
  // `firedRef` guards against StrictMode double-effects in dev.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    const attach = searchParams.get("attach");
    if (!attach) return;
    firedRef.current = true;
    if (attach === "document") doc.open();
    else if (attach === "photo") photo.open();
    // Drop the consumed param so it doesn't fire again on back-nav.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("attach");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      {doc.hiddenInput}
      {photo.hiddenInput}
      {camera.hiddenInput}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Attach"
            className="text-wa-text-muted hover:text-wa-text"
          >
            <Paperclip className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          <DropdownMenuItem onClick={doc.open}>
            <FileText className="mr-2 size-4" /> Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={photo.open}>
            <ImageIcon className="mr-2 size-4" /> Photos &amp; videos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={camera.open}>
            <Camera className="mr-2 size-4" /> Camera
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <UserPlus className="mr-2 size-4" /> Contact
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <BarChart className="mr-2 size-4" /> Poll
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
