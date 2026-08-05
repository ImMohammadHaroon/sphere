import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { useFilePreview } from "@/hooks/useFilePreview";
import { toast } from "@/lib/toast";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import { useUploadRecording } from "../hooks/useUploadRecording";
import { ProjectSelectStep } from "./ProjectSelectStep";
import { CreateTaskForRecordingStep } from "./CreateTaskForRecordingStep";
import { RecordingModeStep } from "./RecordingModeStep";
import { RecordingStudioStep } from "./RecordingStudioStep";
import { UploadSuccessStep } from "./UploadSuccessStep";

const STEPS = {
  PROJECT: "project",
  CREATE_TASK: "create_task",
  MODE: "mode",
  STUDIO: "studio",
  SUCCESS: "success",
};

function getInitialStep(presetProjectId, presetTaskId) {
  if (presetTaskId) {
    return STEPS.MODE;
  }
  if (presetProjectId) {
    return STEPS.CREATE_TASK;
  }
  return STEPS.PROJECT;
}

export function TaskRecordingDialog({
  open,
  onOpenChange,
  projectId: presetProjectId,
  taskId: presetTaskId,
}) {
  const [step, setStep] = useState(() =>
    getInitialStep(presetProjectId, presetTaskId)
  );
  const [projectId, setProjectId] = useState(presetProjectId ?? "");
  const [taskId, setTaskId] = useState(presetTaskId ?? "");
  const [selectedMode, setSelectedMode] = useState(null);
  const [uploadedAttachment, setUploadedAttachment] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const recorder = useMediaRecorder();
  const uploadRecording = useUploadRecording(taskId);
  const filePreview = useFilePreview();

  useEffect(() => {
    if (!open) {
      recorder.reset();
      setStep(getInitialStep(presetProjectId, presetTaskId));
      setProjectId(presetProjectId ?? "");
      setTaskId(presetTaskId ?? "");
      setSelectedMode(null);
      setUploadedAttachment(null);
      setUploadError("");
    }
  }, [open, presetProjectId, presetTaskId, recorder]);

  useEffect(() => {
    if (open) {
      setProjectId(presetProjectId ?? "");
      setTaskId(presetTaskId ?? "");
      setStep(getInitialStep(presetProjectId, presetTaskId));
    }
  }, [open, presetProjectId, presetTaskId]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen && recorder.status === "recording") {
      recorder.stopRecording();
    }
    onOpenChange(nextOpen);
  }

  function handleProjectChange(nextProjectId) {
    setProjectId(nextProjectId);
    setTaskId("");
  }

  function handleTaskReady(nextTaskId) {
    setTaskId(nextTaskId);
    setSelectedMode(null);
    setUploadError("");
    setStep(STEPS.MODE);
  }

  function handleContinueFromProject() {
    if (!projectId) {
      toast.error("Select a project to continue.");
      return;
    }
    setStep(STEPS.CREATE_TASK);
  }

  function handleContinueFromMode() {
    if (!selectedMode) {
      toast.error("Select a recording mode.");
      return;
    }
    setUploadError("");
    setStep(STEPS.STUDIO);
    recorder.prepare(selectedMode);
  }

  async function handleUpload() {
    if (!recorder.blob || !taskId || !selectedMode) {
      return;
    }

    setUploadError("");

    try {
      const result = await uploadRecording.mutateAsync({
        blob: recorder.blob,
        mode: selectedMode,
      });
      setUploadedAttachment(result.attachment);
      setStep(STEPS.SUCCESS);
      toast.success("Recording uploaded.");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload recording."
      );
    }
  }

  async function handleViewRecording() {
    if (!uploadedAttachment || !taskId) {
      return;
    }

    try {
      await filePreview.openPreview(uploadedAttachment, {
        type: "task",
        taskId,
        attachmentId: uploadedAttachment._id,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open recording.");
    }
  }

  function handleRecordAnother() {
    recorder.reset();
    setUploadedAttachment(null);
    setUploadError("");
    setSelectedMode(null);
    setTaskId(presetTaskId ?? "");
    setStep(getInitialStep(presetProjectId, presetTaskId));
  }

  function handleBack() {
    if (step === STEPS.MODE) {
      if (presetTaskId) {
        return;
      }
      recorder.reset();
      setSelectedMode(null);
      setStep(STEPS.CREATE_TASK);
      return;
    }

    if (step === STEPS.CREATE_TASK) {
      if (presetProjectId) {
        return;
      }
      setTaskId("");
      setStep(STEPS.PROJECT);
      return;
    }

    if (step === STEPS.STUDIO) {
      recorder.reset();
      setStep(STEPS.MODE);
    }
  }

  const showBack =
    step === STEPS.STUDIO ||
    (step === STEPS.MODE && !presetTaskId) ||
    (step === STEPS.CREATE_TASK && !presetProjectId);

  const dialogTitle =
    step === STEPS.SUCCESS
      ? "Recording saved"
      : step === STEPS.STUDIO
        ? "Record"
        : step === STEPS.MODE
          ? "Choose recording type"
          : step === STEPS.CREATE_TASK
            ? "Create task"
            : "Record a task";

  const dialogDescription =
    step === STEPS.PROJECT
      ? "Select the project for this recording."
      : step === STEPS.CREATE_TASK
        ? "Create a new task, then record audio, video, or your screen for it."
        : step === STEPS.MODE
          ? "Pick audio, video, or screen capture."
          : step === STEPS.STUDIO
            ? "Record your clip, then upload it to the task."
            : "Your recording is attached to the task.";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={
            step === STEPS.STUDIO || step === STEPS.CREATE_TASK
              ? "max-w-2xl"
              : "max-w-lg"
          }
          onClose={() => handleOpenChange(false)}
        >
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {step === STEPS.PROJECT ? (
            <ProjectSelectStep
              projectId={presetProjectId}
              onProjectChange={handleProjectChange}
            />
          ) : null}

          {step === STEPS.CREATE_TASK ? (
            <CreateTaskForRecordingStep
              projectId={projectId}
              onTaskReady={handleTaskReady}
            />
          ) : null}

          {step === STEPS.MODE ? (
            <RecordingModeStep
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
            />
          ) : null}

          {step === STEPS.STUDIO ? (
            <RecordingStudioStep
              recorder={recorder}
              onUpload={handleUpload}
              isUploading={uploadRecording.isPending}
              uploadError={uploadError}
            />
          ) : null}

          {step === STEPS.SUCCESS && uploadedAttachment ? (
            <UploadSuccessStep
              attachment={uploadedAttachment}
              taskId={taskId}
              onView={handleViewRecording}
              onRecordAnother={handleRecordAnother}
            />
          ) : null}

          {step === STEPS.PROJECT || step === STEPS.MODE ? (
            <DialogFooter>
              {showBack ? (
                <Button type="button" variant="ghost" onClick={handleBack}>
                  Back
                </Button>
              ) : null}
              {step === STEPS.PROJECT ? (
                <Button type="button" variant="record" onClick={handleContinueFromProject}>
                  Continue
                </Button>
              ) : null}
              {step === STEPS.MODE ? (
                <Button type="button" variant="record" onClick={handleContinueFromMode}>
                  Continue
                </Button>
              ) : null}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <FilePreviewDialog {...filePreview.dialogProps} />
    </>
  );
}
