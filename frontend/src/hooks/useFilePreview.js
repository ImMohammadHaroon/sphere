import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAttachmentBlob, toTypedBlob } from "@/lib/attachmentDownload";
import { triggerBlobDownload } from "@/lib/downloadBlob";
import { attachmentMeta, resolveMimeTypeWithBlob } from "@/lib/fileUtils";

const emptyPreview = {
  open: false,
  fileName: "",
  mimeType: "",
  size: null,
};

export function useFilePreview() {
  const [preview, setPreview] = useState(emptyPreview);
  const [blobUrl, setBlobUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const blobUrlRef = useRef(null);

  const revokeUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    setBlob(null);
    setTextContent(null);
  }, []);

  const close = useCallback(() => {
    setPreview(emptyPreview);
    revokeUrl();
    setError(null);
    setIsLoading(false);
  }, [revokeUrl]);

  const openPreview = useCallback(
    async (item, source) => {
      const meta = attachmentMeta(item);
      revokeUrl();
      setPreview({
        open: true,
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        size: meta.size,
      });
      setError(null);
      setIsLoading(true);

      try {
        const rawBlob = await fetchAttachmentBlob(source);
        const resolvedMimeType = await resolveMimeTypeWithBlob(
          meta.fileName,
          meta.mimeType,
          rawBlob
        );
        const typedBlob = toTypedBlob(rawBlob, resolvedMimeType);
        setBlob(typedBlob);
        setPreview((current) => ({
          ...current,
          mimeType: resolvedMimeType,
        }));

        if (resolvedMimeType.startsWith("text/")) {
          setTextContent(await typedBlob.text());
        } else {
          const url = URL.createObjectURL(typedBlob);
          blobUrlRef.current = url;
          setBlobUrl(url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file.");
      } finally {
        setIsLoading(false);
      }
    },
    [revokeUrl]
  );

  const download = useCallback(() => {
    if (!blob) {
      return;
    }
    triggerBlobDownload(blob, preview.fileName, preview.mimeType);
  }, [blob, preview.fileName, preview.mimeType]);

  useEffect(() => () => revokeUrl(), [revokeUrl]);

  return {
    openPreview,
    close,
    download,
    dialogProps: {
      open: preview.open,
      onOpenChange: (nextOpen) => {
        if (!nextOpen) {
          close();
        }
      },
      fileName: preview.fileName,
      mimeType: preview.mimeType,
      size: preview.size,
      blobUrl,
      textContent,
      isLoading,
      error,
      onDownload: download,
    },
  };
}
