import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import {
  RECORDING_MODES,
  RECORDING_WARN_SIZE,
  blobMimeForMode,
} from "../constants";

function pickRecorderMime(mode) {
  const candidates =
    mode === RECORDING_MODES.AUDIO
      ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      : [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4",
        ];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return "";
}

async function getMediaStream(mode) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Recording is not supported in this browser.");
  }

  if (mode === RECORDING_MODES.AUDIO) {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  if (mode === RECORDING_MODES.VIDEO) {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  if (mode === RECORDING_MODES.SCREEN) {
    if (!navigator.mediaDevices.getDisplayMedia) {
      throw new Error("Screen recording is not supported in this browser.");
    }
    return navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  }

  throw new Error("Unknown recording mode.");
}

export function useMediaRecorder() {
  const [status, setStatus] = useState("idle");
  const [mode, setMode] = useState(null);
  const [duration, setDuration] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewStream, setPreviewStream] = useState(null);
  const [error, setError] = useState(null);
  const [sizeWarning, setSizeWarning] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const modeRef = useRef(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setPreviewStream(null);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopTimer();
    cleanupStream();
    setStatus("idle");
    setMode(null);
    modeRef.current = null;
    setDuration(0);
    durationRef.current = 0;
    setEstimatedSize(0);
    setBlob(null);
    setError(null);
    setSizeWarning(false);
  }, [cleanupStream, stopTimer]);

  const prepare = useCallback(
    async (recordingMode) => {
      reset();
      setStatus("preparing");
      setMode(recordingMode);
      modeRef.current = recordingMode;

      try {
        const stream = await getMediaStream(recordingMode);
        streamRef.current = stream;
        setPreviewStream(stream);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (mediaRecorderRef.current?.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          };
        }

        setStatus("ready");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to access media devices.";
        setError(message);
        setStatus("error");
        cleanupStream();
      }
    },
    [reset, cleanupStream]
  );

  const startRecording = useCallback(() => {
    if (!streamRef.current || status !== "ready" || !modeRef.current) {
      return;
    }

    const recordingMode = modeRef.current;
    const mimeType = pickRecorderMime(recordingMode);
    const options = mimeType ? { mimeType } : {};

    if (recordingMode !== RECORDING_MODES.AUDIO) {
      options.videoBitsPerSecond = 800_000;
    } else {
      options.audioBitsPerSecond = 64_000;
    }

    try {
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, options)
        : new MediaRecorder(streamRef.current);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size <= 0) {
          return;
        }

        chunksRef.current.push(event.data);
        const size = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        setEstimatedSize(size);

        if (size >= RECORDING_WARN_SIZE) {
          setSizeWarning(true);
        }

        if (size >= MAX_ATTACHMENT_SIZE && recorder.state === "recording") {
          recorder.stop();
        }
      };

      recorder.onstop = () => {
        stopTimer();
        const recordedType =
          recorder.mimeType || blobMimeForMode(recordingMode);
        const recordedBlob = new Blob(chunksRef.current, { type: recordedType });
        setBlob(recordedBlob);
        setEstimatedSize(recordedBlob.size);
        cleanupStream();
        setStatus("stopped");
      };

      recorder.onerror = () => {
        setError("Recording failed.");
        setStatus("error");
        stopTimer();
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      durationRef.current = 0;
      setDuration(0);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);
      setStatus("recording");
      setSizeWarning(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording."
      );
      setStatus("error");
    }
  }, [status, cleanupStream, stopTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const discardRecording = useCallback(() => {
    chunksRef.current = [];
    setBlob(null);
    setEstimatedSize(0);
    setSizeWarning(false);
    setDuration(0);
    durationRef.current = 0;
    setError(null);

    if (modeRef.current) {
      prepare(modeRef.current);
    } else {
      setStatus("idle");
    }
  }, [prepare]);

  useEffect(
    () => () => {
      stopTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    },
    [stopTimer]
  );

  return {
    status,
    mode,
    duration,
    estimatedSize,
    blob,
    previewStream,
    error,
    sizeWarning,
    prepare,
    startRecording,
    stopRecording,
    discardRecording,
    reset,
    isNearLimit: estimatedSize >= RECORDING_WARN_SIZE,
    isAtLimit: estimatedSize >= MAX_ATTACHMENT_SIZE,
  };
}
