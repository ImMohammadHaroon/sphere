import { File, FileImage, FileText } from "lucide-react";

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const EXTENSION_MIME_TYPES = {
  avi: "video/x-msvideo",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  json: "application/json",
  md: "text/markdown",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain",
  wav: "audio/wav",
  webm: "video/webm",
  webp: "image/webp",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

export function isGenericMimeType(mimeType) {
  return GENERIC_MIME_TYPES.has(mimeType ?? "");
}

export function inferMimeTypeFromFileName(fileName) {
  if (!fileName || !fileName.includes(".")) {
    return null;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? EXTENSION_MIME_TYPES[extension] ?? null : null;
}

export function resolveMimeType(fileName, storedMimeType, blobMimeType = "") {
  if (!isGenericMimeType(storedMimeType)) {
    return storedMimeType;
  }

  if (!isGenericMimeType(blobMimeType)) {
    return blobMimeType;
  }

  return inferMimeTypeFromFileName(fileName) ?? storedMimeType ?? blobMimeType ?? "";
}

export async function sniffMimeTypeFromBlob(blob) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    return null;
  }

  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());

  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "image/png";
  }

  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    header.length >= 6 &&
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46
  ) {
    return "image/gif";
  }

  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    header.length >= 5 &&
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46
  ) {
    return "application/pdf";
  }

  return null;
}

export async function resolveMimeTypeWithBlob(fileName, storedMimeType, blob) {
  const initial = resolveMimeType(fileName, storedMimeType, blob?.type ?? "");
  if (!isGenericMimeType(initial)) {
    return initial;
  }

  const sniffed = await sniffMimeTypeFromBlob(blob);
  return sniffed ?? initial;
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType) {
  if (mimeType?.startsWith("image/")) {
    return FileImage;
  }
  if (
    mimeType?.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType?.includes("document")
  ) {
    return FileText;
  }
  return File;
}

export function getPreviewKind(mimeType) {
  if (!mimeType) return "none";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "none";
}

export function attachmentMeta(attachment) {
  const fileName = attachment.fileName ?? attachment.name ?? "file";
  const storedMimeType =
    attachment.mimeType ?? attachment.mimetype ?? attachment.type ?? "";

  return {
    fileName,
    mimeType: resolveMimeType(fileName, storedMimeType),
    size: attachment.size ?? null,
  };
}
