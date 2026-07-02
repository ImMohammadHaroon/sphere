import { apiClient } from "@/lib/apiClient";

export function listProjects() {
  return apiClient("/projects");
}
