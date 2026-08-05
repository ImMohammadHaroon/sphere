import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/features/projects/hooks/useProjects";
import { useCreateTask } from "@/features/tasks/hooks/useCreateTask";
import { useProjectMembers } from "@/features/tasks/hooks/useProjectMembers";
import { useProjectTasks } from "@/features/tasks/hooks/useProjectTasks";
import { dateInputToIso } from "@/lib/dateFormHelpers";
import {
  DEFAULT_BOARD_COLUMNS,
  getSortedColumns,
  getStatusLabel,
} from "@/lib/taskStatusConfig";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";

const selectClassName =
  "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

function createEmptyForm(status = "") {
  return {
    title: "",
    description: "",
    assigneeId: "",
    status,
    priority: "medium",
    dueDate: "",
  };
}

function formatRoleLabel(role) {
  const labels = {
    org_admin: "Organization Admin",
    project_manager: "Project Manager",
    team_member: "Team Member",
    client: "Client",
  };
  return labels[role] ?? role?.replaceAll("_", " ") ?? "";
}

export function CreateTaskForRecordingStep({
  projectId,
  onTaskReady,
  isSubmittingExternal = false,
}) {
  const [mode, setMode] = useState("create");
  const [existingTaskId, setExistingTaskId] = useState("");
  const [form, setForm] = useState(createEmptyForm());
  const [error, setError] = useState("");

  const createTask = useCreateTask(projectId);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
  } = useProjectTasks(projectId);

  const columns = useMemo(() => {
    if (project?.columns?.length) {
      return getSortedColumns(project.columns);
    }
    return DEFAULT_BOARD_COLUMNS;
  }, [project?.columns]);

  const defaultColumnKey = columns[0]?.key ?? "";

  useEffect(() => {
    setForm(createEmptyForm(defaultColumnKey));
    setExistingTaskId("");
    setError("");
    setMode("create");
  }, [projectId, defaultColumnKey]);

  const isSubmitting = createTask.isPending || isSubmittingExternal;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      const result = await createTask.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        assigneeId: form.assigneeId || null,
        status: form.status || defaultColumnKey || undefined,
        priority: form.priority,
        dueDate: dateInputToIso(form.dueDate),
      });

      const newTaskId = result?.task?._id;
      if (!newTaskId) {
        setError("Task was created but could not continue. Try again.");
        return;
      }

      onTaskReady(newTaskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  }

  function handleUseExisting() {
    setError("");
    if (!existingTaskId) {
      setError("Select an existing task to continue.");
      return;
    }
    onTaskReady(existingTaskId);
  }

  if (!projectId) {
    return (
      <p className="text-sm text-text-secondary">
        Select a project to create or choose a task.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {project?.name ? (
        <p className="text-sm text-text-secondary">
          Project: <span className="font-medium text-text-primary">{project.name}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "create" ? "record" : "outline"}
          onClick={() => {
            setMode("create");
            setError("");
          }}
        >
          Create new task
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "existing" ? "record" : "outline"}
          onClick={() => {
            setMode("existing");
            setError("");
          }}
        >
          Use existing task
        </Button>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {mode === "create" ? (
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          <div className="space-y-2">
            <Label htmlFor="record-task-title">Title</Label>
            <Input
              id="record-task-title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="record-task-description">Description</Label>
            <textarea
              id="record-task-description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Optional details"
              rows={3}
              className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="record-task-status">Start in column</Label>
              <select
                id="record-task-status"
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                disabled={projectLoading || columns.length === 0}
                className={selectClassName}
              >
                {projectLoading ? (
                  <option value="">Loading board...</option>
                ) : (
                  columns.map((column) => (
                    <option key={column.key} value={column.key}>
                      {getStatusLabel(columns, column.key)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="record-task-assignee">Assignee</Label>
              <select
                id="record-task-assignee"
                value={form.assigneeId}
                onChange={(event) => updateField("assigneeId", event.target.value)}
                disabled={membersLoading}
                className={selectClassName}
              >
                <option value="">
                  {membersLoading ? "Loading members..." : "Unassigned"}
                </option>
                {(members ?? []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.role ? ` (${formatRoleLabel(member.role)})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="record-task-priority">Priority</Label>
              <select
                id="record-task-priority"
                value={form.priority}
                onChange={(event) => updateField("priority", event.target.value)}
                className={selectClassName}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-task-due">Due date</Label>
              <Input
                id="record-task-due"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="record" isLoading={isSubmitting}>
              Create task & continue
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {tasksLoading ? <Skeleton className="h-10 w-full" /> : null}
          {tasksError ? (
            <Alert variant="error">Failed to load tasks for this project.</Alert>
          ) : null}
          {!tasksLoading && !tasksError ? (
            <div className="space-y-2">
              <Label htmlFor="record-existing-task">Task</Label>
              <select
                id="record-existing-task"
                value={existingTaskId}
                onChange={(event) => setExistingTaskId(event.target.value)}
                className={selectClassName}
              >
                <option value="">Select a task</option>
                {tasks.map((task) => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {tasks.length === 0 ? (
                <p className="text-xs text-text-muted">
                  No tasks in this project. Create a new task instead.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="record"
              onClick={handleUseExisting}
              disabled={!existingTaskId || isSubmitting}
              isLoading={isSubmitting}
            >
              Continue to recording
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
