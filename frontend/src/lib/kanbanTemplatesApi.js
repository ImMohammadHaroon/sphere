import { apiClient } from "@/lib/apiClient";

export function listTemplates() {
  return apiClient("/kanban-templates");
}

export function getTemplate(id) {
  return apiClient(`/kanban-templates/${id}`);
}

export function createTemplate({ name, columns }) {
  return apiClient("/kanban-templates", {
    method: "POST",
    body: { name, columns },
  });
}

export function updateTemplate(id, { name, columns }) {
  return apiClient(`/kanban-templates/${id}`, {
    method: "PATCH",
    body: { name, columns },
  });
}

export function deleteTemplate(id) {
  return apiClient(`/kanban-templates/${id}`, {
    method: "DELETE",
  });
}
