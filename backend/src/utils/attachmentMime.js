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

export function inferMimeTypeFromFileName(fileName) {
  if (!fileName || !fileName.includes(".")) {
    return null;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? EXTENSION_MIME_TYPES[extension] ?? null : null;
}

export function resolveAttachmentContentType(fileName, storedMimeType) {
  if (storedMimeType && !GENERIC_MIME_TYPES.has(storedMimeType)) {
    return storedMimeType;
  }

  return inferMimeTypeFromFileName(fileName) ?? storedMimeType ?? "application/octet-stream";
}
