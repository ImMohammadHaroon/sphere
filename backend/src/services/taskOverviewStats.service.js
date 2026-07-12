import { DEFAULT_BOARD_COLUMNS, copyColumns } from "./kanbanTemplate.service.js";

function projectColumns(project) {
  if (project.columns?.length) {
    return copyColumns(project.columns);
  }
  return copyColumns(DEFAULT_BOARD_COLUMNS);
}

function buildCountMap(taskCountRows) {
  const countMap = new Map();

  for (const row of taskCountRows) {
    const projectId = row._id.projectId?.toString?.() ?? String(row._id.projectId);
    const status = row._id.status;

    if (!countMap.has(projectId)) {
      countMap.set(projectId, new Map());
    }

    countMap.get(projectId).set(status, row.count);
  }

  return countMap;
}

export function buildTasksByProject(projects, taskCountRows) {
  const countMap = buildCountMap(taskCountRows);

  return projects.map((project) => {
    const projectId = project._id.toString();
    const statusCounts = countMap.get(projectId) ?? new Map();
    const columns = projectColumns(project).map((column) => ({
      key: column.key,
      name: column.name,
      color: column.color,
      order: column.order,
      isDone: column.isDone ?? false,
      count: statusCounts.get(column.key) ?? 0,
    }));

    for (const [status, count] of statusCounts.entries()) {
      if (!columns.some((column) => column.key === status)) {
        columns.push({
          key: status,
          name: status,
          color: "gray",
          order: columns.length,
          isDone: false,
          count,
        });
      }
    }

    columns.sort((a, b) => a.order - b.order);

    return {
      projectId,
      projectName: project.name,
      columns,
    };
  });
}

export function totalTasksFromProjects(tasksByProject) {
  return (tasksByProject ?? []).reduce(
    (sum, project) =>
      sum +
      (project.columns ?? []).reduce(
        (columnSum, column) => columnSum + (column.count ?? 0),
        0
      ),
    0
  );
}
