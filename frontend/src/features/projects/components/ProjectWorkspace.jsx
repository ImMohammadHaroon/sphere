import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ProjectMilestonesTab } from "./ProjectMilestonesTab";
import { ProjectTasksTab } from "./ProjectTasksTab";

export function ProjectWorkspace({
  projectId,
  role: roleProp,
  toolbar = null,
  canManageMilestones = false,
}) {
  const { user } = useAuth();
  const role = roleProp ?? user?.role ?? "project_manager";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "milestones" ? "milestones" : "tasks";
  const selectedTaskId = searchParams.get("task") ?? "";

  function handleTabChange(nextTab) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    if (nextTab === "milestones") {
      nextParams.delete("task");
    }
    setSearchParams(nextParams);
  }

  function handleTaskSelect(taskId) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", "tasks");

    if (!taskId || taskId === selectedTaskId) {
      nextParams.delete("task");
      setSearchParams(nextParams);
      return;
    }

    nextParams.set("task", taskId);
    setSearchParams(nextParams);
  }

  return (
    <div className="space-y-6">
      {toolbar}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <ProjectTasksTab
            projectId={projectId}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
          />
        </TabsContent>

        <TabsContent value="milestones">
          <ProjectMilestonesTab
            projectId={projectId}
            role={role}
            canManage={canManageMilestones}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
