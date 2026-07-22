import { isGenericMimeType } from "@/lib/fileUtils";

export function toTypedBlob(blob, mimeType) {
  if (!mimeType) {
    return blob;
  }

  if (!blob.type || isGenericMimeType(blob.type)) {
    return new Blob([blob], { type: mimeType });
  }

  return blob;
}

export function triggerBlobDownload(blob, fileName, mimeType) {
  const typedBlob = toTypedBlob(blob, mimeType);
  const objectUrl = URL.createObjectURL(typedBlob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || "download";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
