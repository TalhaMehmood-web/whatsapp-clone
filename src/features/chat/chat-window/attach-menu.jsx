"use client";

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
