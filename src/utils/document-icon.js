import {
  FaFile,
  FaFileAlt,
  FaFileArchive,
  FaFileAudio,
  FaFileCode,
  FaFileCsv,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
} from "react-icons/fa";

// Pick a brand-accurate file icon + a tint colour for the given document.
// Returns `{ Icon, accent }` so the caller can colour both the icon and
// any badge it wraps it in.
//
// Colours roughly match the brand of each office format so users can
// distinguish a PDF from a Word doc at a glance, matching the WhatsApp
// Web treatment.
export function documentIcon({ mime = "", fileName = "" } = {}) {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();

  if (mime === "application/pdf" || ext === "pdf") {
    return { Icon: FaFilePdf, accent: "text-red-500" };
  }

  if (
    mime.includes("word") ||
    ext === "doc" ||
    ext === "docx" ||
    ext === "odt" ||
    ext === "rtf"
  ) {
    return { Icon: FaFileWord, accent: "text-blue-500" };
  }

  if (mime === "text/csv" || ext === "csv") {
    return { Icon: FaFileCsv, accent: "text-emerald-500" };
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ext === "xls" ||
    ext === "xlsx" ||
    ext === "ods"
  ) {
    return { Icon: FaFileExcel, accent: "text-emerald-500" };
  }

  if (
    mime.includes("presentation") ||
    ext === "ppt" ||
    ext === "pptx" ||
    ext === "odp" ||
    ext === "key"
  ) {
    return { Icon: FaFilePowerpoint, accent: "text-orange-500" };
  }

  if (
    mime === "application/zip" ||
    mime.includes("compressed") ||
    ext === "zip" ||
    ext === "rar" ||
    ext === "7z" ||
    ext === "tar" ||
    ext === "gz"
  ) {
    return { Icon: FaFileArchive, accent: "text-amber-500" };
  }

  if (mime.startsWith("image/")) {
    return { Icon: FaFileImage, accent: "text-violet-400" };
  }
  if (mime.startsWith("video/")) {
    return { Icon: FaFileVideo, accent: "text-rose-400" };
  }
  if (mime.startsWith("audio/")) {
    return { Icon: FaFileAudio, accent: "text-cyan-400" };
  }

  if (
    ext === "json" ||
    ext === "xml" ||
    ext === "html" ||
    ext === "css" ||
    ext === "js" ||
    ext === "ts" ||
    ext === "tsx" ||
    ext === "jsx" ||
    ext === "py" ||
    ext === "java"
  ) {
    return { Icon: FaFileCode, accent: "text-sky-400" };
  }

  if (mime.startsWith("text/") || ext === "txt" || ext === "md" || ext === "log") {
    return { Icon: FaFileAlt, accent: "text-sky-400" };
  }

  return { Icon: FaFile, accent: "text-wa-text-muted" };
}
