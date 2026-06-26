import { CallType, MessageMetadataKind } from "@/models/enums";

// Generates the chat-list preview text for a message.
// Falls back to a media-type label when there is no text content.
export function previewText(message) {
  if (!message) return "";
  if (message.deletedAt) return "This message was deleted";
  if (message.content) return message.content;

  switch (message.type) {
    case "IMAGE":
      return "Photo";
    case "VIDEO":
      return "Video";
    case "AUDIO":
      return "Audio";
    case "VOICE_NOTE":
      return "Voice message";
    case "DOCUMENT":
      return message.fileName ?? "Document";
    case "STICKER":
      return "Sticker";
    case "LOCATION":
      return "Location";
    case "CONTACT":
      return "Contact";
    case "POLL":
      return "Poll";
    case "SYSTEM":
      return systemPreview(message);
    default:
      return "";
  }
}

function systemPreview(message) {
  const meta = message.metadata ?? {};
  if (meta.kind !== MessageMetadataKind.CALL) return "";
  const isVideo = meta.callType === CallType.VIDEO;
  if (meta.callStatus === "MISSED")
    return isVideo ? "Missed video call" : "Missed voice call";
  if (meta.callStatus === "DECLINED")
    return isVideo ? "Declined video call" : "Declined voice call";
  if (!meta.durationSec) return isVideo ? "Video call" : "Voice call";
  const m = Math.floor(meta.durationSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (meta.durationSec % 60).toString().padStart(2, "0");
  return `${isVideo ? "Video call" : "Voice call"} · ${m}:${s}`;
}
