import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TaskRecordingDialog } from "./TaskRecordingDialog";

export function RecordTaskButton({
  projectId,
  taskId,
  variant = "record",
  size = "sm",
  className,
  children,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? (
          <>
            <Mic className="mr-2 h-3.5 w-3.5" />
            Record a task
          </>
        )}
      </Button>
      <TaskRecordingDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        taskId={taskId}
      />
    </>
  );
}
