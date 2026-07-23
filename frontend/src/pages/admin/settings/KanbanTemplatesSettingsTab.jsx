import { useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { ColumnColorDots } from "@/features/kanban-templates/ColumnsBuilder";
import { TemplateFormDialog } from "@/features/kanban-templates/TemplateFormDialog";
import {
  useCreateKanbanTemplate,
  useDeleteKanbanTemplate,
  useKanbanTemplates,
  useUpdateKanbanTemplate,
} from "@/features/kanban-templates/hooks/useKanbanTemplates";

export function KanbanTemplatesSettingsTab() {
  const { data: templates, isLoading, isError, error, refetch, isFetching } =
    useKanbanTemplates();
  const createTemplate = useCreateKanbanTemplate();
  const updateTemplate = useUpdateKanbanTemplate();
  const deleteTemplate = useDeleteKanbanTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setEditingTemplate(null);
    setFormOpen(true);
  }

  function openEdit(template) {
    setEditingTemplate(template);
    setFormOpen(true);
  }

  function openDelete(template) {
    setDeleteTarget(template);
  }

  async function handleCreate({ name, columns }) {
    await createTemplate.mutateAsync({ name, columns });
  }

  async function handleUpdate({ name, columns }) {
    await updateTemplate.mutateAsync({
      id: editingTemplate._id,
      data: { name, columns },
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteTemplate.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        throw err;
      }
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete template."
      );
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Kanban templates</CardTitle>
            <CardDescription>
              Reusable board layouts for new projects. Editing a template does not
              change existing project boards.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openCreate}>
            New template
          </Button>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-3 px-6 pb-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {isError ? (
          <div className="px-6 pb-6">
            <Alert variant="error">
              {error instanceof Error ? error.message : "Failed to load templates."}
            </Alert>
            <Button className="mt-3" onClick={() => refetch()} isLoading={isFetching}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="space-y-3 px-6 pb-6">
            {(templates ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary">
                No templates yet. Create one to reuse across projects.
              </p>
            ) : (
              (templates ?? []).map((template) => (
                <div
                  key={template._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium text-text-primary">{template.name}</p>
                    <p className="text-sm text-text-secondary">
                      {template.columns?.length ?? 0} column
                      {(template.columns?.length ?? 0) === 1 ? "" : "s"}
                    </p>
                    <ColumnColorDots columns={template.columns ?? []} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      onClick={() => openDelete(template)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </Card>

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingTemplate ? "Edit template" : "New template"}
        description="Define column names, colors, and which column marks tasks as done."
        initialName={editingTemplate?.name ?? ""}
        initialColumns={editingTemplate?.columns}
        isSubmitting={createTemplate.isPending || updateTemplate.isPending}
        onSubmit={editingTemplate ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete template"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : null
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteTemplate.isPending}
      />
    </>
  );
}
