import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAttachment } from "@/lib/attachmentsApi";
import { blobMimeForMode, recordingFileName } from "../constants";

export function useUploadRecording(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blob, mode }) => {
      const mimeType = blob.type || blobMimeForMode(mode);
      const fileName = recordingFileName(mode);
      const file = new File([blob], fileName, { type: mimeType });
      return uploadAttachment(taskId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });
}
