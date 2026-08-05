import { useEffect, useRef } from "react";
import { Loader2, Mic } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatFileSize, MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import {
  formatRecordingDuration,
  MODE_LABELS,
  RECORDING_MODES,
  RECORDING_WARN_SIZE,
} from "../constants";

export function RecordingStudioStep({
  recorder,
  onUpload,
  isUploading,
  uploadError,
}) {
  const previewRef = useRef(null);
  const playbackRef = useRef(null);

  const {
    status,
    mode,
    duration,
    estimatedSize,
    blob,
    previewStream,
    error,
    sizeWarning,
    startRecording,
    stopRecording,
    discardRecording,
    isAtLimit,
  } = recorder;

  useEffect(() => {
    if (previewRef.current && previewStream) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    if (!blob) {
      return undefined;
    }

    const url = URL.createObjectURL(blob);
    if (playbackRef.current) {
      playbackRef.current.src = url;
    }

    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const showVideoPreview =
    mode === RECORDING_MODES.VIDEO || mode === RECORDING_MODES.SCREEN;
  const isRecording = status === "recording";
  const isStopped = status === "stopped" && blob;
  const isPreparing = status === "preparing";
  const isReady = status === "ready";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-text-primary">
          {mode ? MODE_LABELS[mode] : "Recording"}
        </span>
        <span className="text-text-muted">
          {formatRecordingDuration(duration)}
          {estimatedSize > 0 ? ` · ${formatFileSize(estimatedSize)}` : ""}
        </span>
      </div>

      <p className="text-xs text-text-muted">
        Max file size {formatFileSize(MAX_ATTACHMENT_SIZE)}. Recording stops
        automatically near the limit.
      </p>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}

      {sizeWarning || isAtLimit ? (
        <Alert variant={isAtLimit ? "error" : "info"}>
          {isAtLimit
            ? "Maximum size reached. Recording stopped."
            : `Approaching limit (${formatFileSize(RECORDING_WARN_SIZE)}).`}
        </Alert>
      ) : null}

      <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
        {isPreparing ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}

        {!isPreparing && showVideoPreview && !isStopped ? (
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full bg-black object-contain"
          />
        ) : null}

        {!isPreparing && mode === RECORDING_MODES.AUDIO && !isStopped ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full",
                isRecording ? "bg-primary/20 text-primary" : "bg-surface-raised text-text-muted"
              )}
            >
              <Mic className="h-8 w-8" />
            </div>
          </div>
        ) : null}

        {isStopped ? (
          <div className="p-2">
            {showVideoPreview ? (
              <video
                ref={playbackRef}
                controls
                playsInline
                className="aspect-video w-full rounded-md bg-black object-contain"
              />
            ) : (
              <audio ref={playbackRef} controls className="w-full" />
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {isReady ? (
          <Button type="button" onClick={startRecording}>
            Start recording
          </Button>
        ) : null}

        {isRecording ? (
          <Button type="button" variant="danger" onClick={stopRecording}>
            Stop recording
          </Button>
        ) : null}

        {isStopped ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={discardRecording}
              disabled={isUploading}
            >
              Re-record
            </Button>
            <Button
              type="button"
              onClick={onUpload}
              isLoading={isUploading}
              disabled={!blob || estimatedSize > MAX_ATTACHMENT_SIZE}
            >
              Upload to task
            </Button>
          </>
        ) : null}
      </div>

      {isStopped && estimatedSize > MAX_ATTACHMENT_SIZE ? (
        <Alert variant="error">
          Recording is too large ({formatFileSize(estimatedSize)}). Re-record a
          shorter clip.
        </Alert>
      ) : null}
    </div>
  );
}
