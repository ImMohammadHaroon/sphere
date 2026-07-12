import { useCallback, useEffect, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useSocket } from "@/hooks/useSocket";
import { getProjectTasks, moveTask as moveTaskApi } from "@/lib/tasksApi";
import { getSortedColumns } from "@/lib/taskStatusConfig";

function optimisticMoveTasks(tasks, taskId, newStatus, newPosition) {
  const moving = tasks.find((task) => task._id === taskId);
  if (!moving) {
    return tasks;
  }

  const oldStatus = moving.status;
  const others = tasks.filter((task) => task._id !== taskId);

  const dest = others
    .filter((task) => task.status === newStatus)
    .sort((a, b) => a.position - b.position);

  dest.splice(newPosition, 0, { ...moving, status: newStatus });
  const reindexedDest = dest.map((task, index) => ({
    ...task,
    position: index,
  }));
  const destIds = new Set(reindexedDest.map((task) => task._id));

  let result = [
    ...others.filter((task) => task.status !== newStatus || !destIds.has(task._id)),
    ...reindexedDest,
  ];

  if (oldStatus !== newStatus) {
    const source = result
      .filter((task) => task.status === oldStatus)
      .sort((a, b) => a.position - b.position)
      .map((task, index) => ({ ...task, position: index }));
    const sourceIds = new Set(source.map((task) => task._id));
    result = [
      ...result.filter((task) => task.status !== oldStatus || !sourceIds.has(task._id)),
      ...source,
    ];
  }

  return result;
}

function mergeTaskUpdate(tasks, updatedTask) {
  const index = tasks.findIndex((task) => task._id === updatedTask._id);
  if (index === -1) {
    return [...tasks, updatedTask];
  }
  const next = [...tasks];
  next[index] = { ...next[index], ...updatedTask };
  return next;
}

export function useKanbanTasks(projectId, columns, { onError } = {}) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewers, setViewers] = useState([]);
  const pendingMovesRef = useRef(new Set());
  const socket = useSocket(projectId);

  const sortedColumns = getSortedColumns(columns);
  const columnKeys = sortedColumns.map((col) => col.key);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getProjectTasks(projectId);
      setTasks(result.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load tasks"));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    function onTaskMoved(payload) {
      const { taskId, status, position } = payload;
      if (pendingMovesRef.current.has(taskId)) {
        return;
      }
      setTasks((prev) => optimisticMoveTasks(prev, taskId, status, position));
    }

    function onTaskCreated(task) {
      setTasks((prev) => {
        if (prev.some((item) => item._id === task._id)) {
          return prev;
        }
        return [...prev, task];
      });
    }

    function onTaskUpdated(task) {
      setTasks((prev) => mergeTaskUpdate(prev, task));
    }

    function onPresenceJoin({ userId }) {
      setViewers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    }

    function onPresenceLeave({ userId }) {
      setViewers((prev) => prev.filter((id) => id !== userId));
    }

    socket.on("task:moved", onTaskMoved);
    socket.on("task:created", onTaskCreated);
    socket.on("task:updated", onTaskUpdated);
    socket.on("presence:join", onPresenceJoin);
    socket.on("presence:leave", onPresenceLeave);

    return () => {
      socket.off("task:moved", onTaskMoved);
      socket.off("task:created", onTaskCreated);
      socket.off("task:updated", onTaskUpdated);
      socket.off("presence:join", onPresenceJoin);
      socket.off("presence:leave", onPresenceLeave);
    };
  }, [socket]);

  const moveTaskOptimistic = useCallback(
    async (taskId, status, position) => {
      const snapshot = tasks;
      pendingMovesRef.current.add(taskId);
      setTasks((prev) => optimisticMoveTasks(prev, taskId, status, position));

      try {
        await moveTaskApi(taskId, { status, position });
      } catch (err) {
        pendingMovesRef.current.delete(taskId);
        setTasks(snapshot);
        onError?.(err instanceof Error ? err : new Error("Failed to move task"));
      } finally {
        pendingMovesRef.current.delete(taskId);
      }
    },
    [tasks, onError]
  );

  const handleDragEnd = useCallback(
    (activeId, overId) => {
      if (!overId || activeId === overId) {
        return;
      }

      const activeTask = tasks.find((task) => task._id === activeId);
      if (!activeTask) {
        return;
      }

      const overKey = String(overId);
      let targetStatus;

      if (overKey.startsWith("column-")) {
        targetStatus = overKey.replace("column-", "");
      } else {
        const overTask = tasks.find((task) => task._id === overId);
        if (!overTask) {
          return;
        }
        targetStatus = overTask.status;
      }

      const columnTasks = tasks
        .filter((task) => task.status === targetStatus)
        .sort((a, b) => a.position - b.position);

      let newPosition;

      if (activeTask.status === targetStatus) {
        const ids = columnTasks.map((task) => task._id);
        const oldIndex = ids.indexOf(activeId);
        let newIndex;

        if (overKey.startsWith("column-")) {
          newIndex = ids.length - 1;
        } else {
          newIndex = ids.indexOf(overId);
        }

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return;
        }

        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        newPosition = reordered.findIndex((task) => task._id === activeId);
      } else {
        const withoutActive = columnTasks;
        if (overKey.startsWith("column-")) {
          newPosition = withoutActive.length;
        } else {
          const overIndex = withoutActive.findIndex((task) => task._id === overId);
          newPosition = overIndex === -1 ? withoutActive.length : overIndex;
        }
      }

      moveTaskOptimistic(activeId, targetStatus, newPosition);
    },
    [tasks, moveTaskOptimistic]
  );

  const tasksByStatus = columnKeys.reduce((groups, status) => {
    groups[status] = tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);
    return groups;
  }, {});

  return {
    tasks,
    tasksByStatus,
    isLoading,
    error,
    viewers,
    refetch: fetchTasks,
    handleDragEnd,
  };
}
