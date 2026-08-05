import { MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";

export const RECORDING_MODES = {
  AUDIO: "audio",
  VIDEO: "video",
  SCREEN: "screen",
};

export const RECORDING_WARN_SIZE = Math.floor(MAX_ATTACHMENT_SIZE * 0.8);

export const MODE_LABELS = {
  [RECORDING_MODES.AUDIO]: "Audio",
  [RECORDING_MODES.VIDEO]: "Video",
  [RECORDING_MODES.SCREEN]: "Screen",
};

export function formatRecordingDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function recordingFileName(mode) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `recording-${mode}-${timestamp}.webm`;
}

export function blobMimeForMode(mode) {
  return mode === RECORDING_MODES.AUDIO ? "audio/webm" : "video/webm";
}
