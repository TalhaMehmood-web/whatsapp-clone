"use client";

import { Play } from "lucide-react";

import { MessageType } from "@/models/enums";
import { documentIcon } from "@/utils/document-icon";
import { cn } from "@/utils/cn";

// Compact mixed preview strip used by the contact-info and group-info
// sheets. Shows up to `limit` tiles drawn from images, videos and docs so
// the row reflects the full media catalog — not just photos.
export function ChatMediaPreviewStrip({
  media = [],
  docs = [],
  limit = 4,
  onOpen,
}) {
  const tiles = pickPreviewTiles({ media, docs, limit });
  if (tiles.length === 0) return null;

  return (
    <div className="flex gap-1 px-4 py-3">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          onClick={onOpen}
          className="relative size-20 shrink-0 overflow-hidden rounded-md bg-wa-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-green"
        >
          <PreviewTile tile={tile} />
        </button>
      ))}
    </div>
  );
}

function PreviewTile({ tile }) {
  if (tile.type === MessageType.VIDEO) {
    return (
      <>
        <video
          src={tile.mediaUrl}
          muted
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/30">
          <Play className="size-4 text-white" />
        </span>
      </>
    );
  }
  if (tile.type === MessageType.DOCUMENT) {
    const { Icon, accent } = documentIcon({
      mime: tile.mediaMime,
      fileName: tile.fileName,
    });
    return (
      <span className="grid size-full place-items-center bg-wa-panel-3">
        <Icon className={cn("size-8", accent)} />
      </span>
    );
  }
  return (
    <img src={tile.mediaUrl} alt="" className="size-full object-cover" />
  );
}

// Interleave the most recent images/videos with a doc thumbnail so the
// strip stays representative when a chat is heavy on documents.
function pickPreviewTiles({ media, docs, limit }) {
  const tiles = [];
  const m = [...media];
  const d = [...docs];
  // Always favour visual content but reserve one slot for a doc tile when
  // both pools are non-empty.
  const reserveDoc = d.length > 0 && limit > 1;
  const mediaSlots = reserveDoc ? limit - 1 : limit;
  for (let i = 0; i < mediaSlots && m.length > 0; i += 1) tiles.push(m.shift());
  if (reserveDoc && d.length > 0) tiles.push(d.shift());
  while (tiles.length < limit && m.length > 0) tiles.push(m.shift());
  while (tiles.length < limit && d.length > 0) tiles.push(d.shift());
  return tiles;
}
