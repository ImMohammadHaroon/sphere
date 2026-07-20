import { getPaletteColor } from "@/lib/taskStatusConfig";

/** Custom column template  product launch workflow, not fixed To Do / Done */
export const HERO_COLUMNS = [
  { key: "backlog", name: "Backlog", color: "gray", order: 0, isDone: false },
  {
    key: "in-build",
    name: "In Build",
    color: "blue",
    order: 1,
    isDone: false,
  },
  {
    key: "client-review",
    name: "Client Review",
    color: "amber",
    order: 2,
    isDone: false,
  },
  {
    key: "launched",
    name: "Launched",
    color: "green",
    order: 3,
    isDone: true,
  },
];

export const HERO_TASKS = [
  {
    id: "task-1",
    title: "Scope onboarding flow",
    status: "backlog",
    priority: "medium",
    assignee: { name: "Maya Chen" },
  },
  {
    id: "task-2",
    title: "API rate-limit policy",
    status: "in-build",
    priority: "high",
    assignee: { name: "James Okonkwo" },
  },
  {
    id: "task-animated",
    title: "Brand guidelines review",
    status: "client-review",
    priority: "high",
    assignee: { name: "Sofia Reyes" },
    animated: true,
  },
  {
    id: "task-4",
    title: "Launch checklist",
    status: "launched",
    priority: "low",
    assignee: { name: "Alex Kim" },
  },
];

export const HERO_PRESENCE = [
  { columnKey: "in-build", color: "#3b82f6", name: "James" },
  { columnKey: "client-review", color: "#d97706", name: "Sofia" },
  { columnKey: "backlog", color: "#6b7280", name: "Maya" },
];

export function columnAccent(column) {
  return getPaletteColor(column.color);
}

export const PLATFORM_FACTS = [
  { value: "5 roles", label: "Distinct experiences" },
  { value: "1 platform", label: "Multi-tenant SaaS" },
  { value: "Zero crossover", label: "Tenant isolation" },
];

export const CORE_FEATURES = [
  {
    id: "kanban",
    title: "Kanban boards you design",
    description:
      "Build custom column templates per project  name your stages, pick colors, mark your own done state, and reuse templates across projects. Drag tasks with @dnd-kit; no forced To Do / In Progress / Done.",
    mono: "columns[].key · isDone · color",
    accent: "green",
  },
  {
    id: "realtime",
    title: "Updates without refreshing",
    description:
      "Socket.io keeps boards in sync  task moves, status changes, and presence indicators appear live for everyone viewing the same project.",
    mono: "socket.io · presence",
    accent: "amber",
  },
  {
    id: "dashboards",
    title: "Dashboards by role",
    description:
      "Super Admins see the platform. Org Admins see their org. PMs see projects. Team Members see assigned work. Clients see only what you share.",
    mono: "role → dashboard",
    accent: "blue",
  },
  {
    id: "notifications",
    title: "Notifications that matter",
    description:
      "Task assignments, completions, invite acceptances, and new org registrations  delivered per user, in real time.",
    mono: "notification.type",
    accent: "purple",
  },
];

export const ROLES = [
  {
    key: "super-admin",
    title: "Super Admin",
    scope: "Platform-wide",
    description:
      "Oversee every organization on the platform — settings and cross-tenant visibility without mixing data.",
    actions: [
      "Manage all organizations",
      "Platform settings",
      "Cross-tenant reports",
    ],
  },
  {
    key: "org-admin",
    title: "Org Admin",
    scope: "Your organization",
    description:
      "Own your team's workspace — invite users, assign roles, and configure Kanban templates.",
    actions: [
      "Invite & manage members",
      "Kanban template library",
      "Org settings & reports",
    ],
  },
  {
    key: "project-manager",
    title: "Project Manager",
    scope: "Projects within org",
    description:
      "Create projects, design workflows, assign tasks, and track burndown, velocity, and workload from one place.",
    actions: [
      "Create projects & milestones",
      "Assign tasks & track progress",
      "Calendar, reports & analytics",
    ],
  },
  {
    key: "team-member",
    title: "Team Member",
    scope: "Assigned work",
    description:
      "Focus on what landed on your board  update status, comment, and move cards without navigating org-wide noise.",
    actions: [
      "Work assigned Kanban tasks",
      "Update status & comment",
      "Personal task dashboard",
    ],
  },
  {
    key: "client",
    title: "Client",
    scope: "Shared projects only",
    description:
      "Read-only visibility into progress on the projects you are invited to  no full account required for transparency.",
    actions: [
      "View project progress",
      "Approve milestones",
      "Branded client portal",
    ],
  },
];

export const SECURITY_POINTS = [
  {
    title: "Tenant isolation",
    description:
      "Every query is scoped by organizationId server-side. One org's projects, tasks, and files never bleed into another's.",
  },
  {
    title: "Encrypted at rest",
    description:
      "Sensitive fields and attachment bytes are encrypted server-side so stored data stays protected beyond access control.",
  },
  {
    title: "Role-based access",
    description:
      "Five distinct roles with enforced permissions. Clients see only shared projects; team members see only their work.",
  },
];
