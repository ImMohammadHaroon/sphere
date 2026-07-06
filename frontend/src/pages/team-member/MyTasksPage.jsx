import { TeamMemberLayout } from "@/components/layout/TeamMemberLayout";

export function MyTasksPage() {
  return (
    <TeamMemberLayout
      title="My tasks (dashboard)"
      description="Tasks assigned to you across projects."
    />
  );
}
