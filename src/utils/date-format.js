import {
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";

// Chat-list timestamp: "16:13" today, "Yesterday", weekday this week, else date.
export function chatListTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  if (isThisYear(d)) return format(d, "dd/MM");
  return format(d, "dd/MM/yyyy");
}

// Message bubble timestamp: always HH:mm.
export function messageTime(date) {
  return format(new Date(date), "HH:mm");
}

// Day separator label shown in the message list.
export function daySeparator(date) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisYear(d)) return format(d, "EEEE, d MMMM");
  return format(d, "d MMMM yyyy");
}

// Status timestamp: "Today at 16:57".
export function statusTime(date) {
  const d = new Date(date);
  const dayPart = isToday(d)
    ? "Today"
    : isYesterday(d)
      ? "Yesterday"
      : format(d, "d MMM");
  return `${dayPart} at ${format(d, "HH:mm")}`;
}

// Presence line: "last seen 5 minutes ago".
export function lastSeenLabel(date) {
  if (!date) return "";
  return `last seen ${formatDistanceToNowStrict(new Date(date))} ago`;
}
