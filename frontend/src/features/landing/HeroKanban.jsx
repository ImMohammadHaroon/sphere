import { useEffect, useRef, useState } from "react";
import { Wifi } from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/taskStatusConfig";
import { cn } from "@/lib/utils";
import {
  HERO_COLUMNS,
  HERO_PRESENCE,
  HERO_TASKS,
  columnAccent,
} from "./landingData";
import { useReducedMotion } from "motion/react";

const ANIMATED_TASK = HERO_TASKS.find((t) => t.animated);
const STATIC_TASKS = HERO_TASKS.filter((t) => !t.animated);

const MOVE_SEQUENCE = ["backlog", "in-build", "client-review", "launched"];

function memberInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function priorityClass(priority) {
  switch (priority) {
    case "high":
      return "bg-danger/15 text-danger";
    case "low":
      return "bg-surface text-text-muted";
    default:
      return "bg-accent-subtle text-accent-foreground";
  }
}

function MiniTaskCard({ task, className, isGhost }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-raised p-2.5 shadow-sm",
        isGhost && "border-dashed opacity-40",
        className
      )}
    >
      <p className="text-xs font-medium text-text-primary sm:text-sm">
        {task.title}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide",
            priorityClass(task.priority)
          )}
        >
          {task.priority}
        </span>
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[9px] font-medium text-primary">
          {memberInitials(task.assignee?.name)}
        </div>
      </div>
    </div>
  );
}

function PresenceDots({ columnKey }) {
  const viewers = HERO_PRESENCE.filter((p) => p.columnKey === columnKey);
  if (viewers.length === 0) return null;

  return (
    <div className="flex items-center gap-1" aria-hidden>
      {viewers.map((viewer) => (
        <span
          key={viewer.name}
          className="relative flex h-4 w-4 items-center justify-center"
          title={`${viewer.name} viewing`}
        >
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-30 motion-reduce:animate-none"
            style={{ backgroundColor: viewer.color }}
          />
          <span
            className="relative h-2.5 w-2.5 rounded-full ring-2 ring-surface-raised"
            style={{ backgroundColor: viewer.color }}
          />
        </span>
      ))}
    </div>
  );
}

export function HeroKanban() {
  const reducedMotion = useReducedMotion();
  const boardRef = useRef(null);
  const columnRefs = useRef([]);
  const [activeStatus, setActiveStatus] = useState("backlog");
  const [isMoving, setIsMoving] = useState(false);
  const [cardStyle, setCardStyle] = useState(null);
  const [mounted, setMounted] = useState(false);

  const activeIndex = MOVE_SEQUENCE.indexOf(activeStatus);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ANIMATED_TASK || reducedMotion) return undefined;

    const advance = () => {
      setIsMoving(true);
      window.setTimeout(() => {
        setActiveStatus((current) => {
          const idx = MOVE_SEQUENCE.indexOf(current);
          return MOVE_SEQUENCE[(idx + 1) % MOVE_SEQUENCE.length];
        });
        setIsMoving(false);
      }, 480);
    };

    const interval = window.setInterval(advance, 3200);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    const board = boardRef.current;
    const column = columnRefs.current[activeIndex];
    if (!board || !column || !ANIMATED_TASK) return;

    const boardRect = board.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();

    setCardStyle({
      left: columnRect.left - boardRect.left + 8,
      top: columnRect.top - boardRect.top + 52,
      width: columnRect.width - 16,
    });
  }, [activeIndex, mounted]);

  useEffect(() => {
    if (!boardRef.current) return undefined;

    const updatePosition = () => {
      const board = boardRef.current;
      const column = columnRefs.current[activeIndex];
      if (!board || !column) return;

      const boardRect = board.getBoundingClientRect();
      const columnRect = column.getBoundingClientRect();

      setCardStyle({
        left: columnRect.left - boardRect.left + 8,
        top: columnRect.top - boardRect.top + 52,
        width: columnRect.width - 16,
      });
    };

    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [activeIndex]);

  const tasksByColumn = HERO_COLUMNS.reduce((acc, col) => {
    acc[col.key] = STATIC_TASKS.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg",
        "transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none",
        mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      aria-label="Interactive preview of a custom Kanban workflow"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            template: product-launch
          </p>
          <p className="text-sm font-medium text-text-primary">
            Q3 Client Onboarding
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary-subtle px-2.5 py-1">
          <Wifi
            className={cn(
              "h-3.5 w-3.5 text-primary",
              !reducedMotion && "animate-pulse motion-reduce:animate-none"
            )}
            aria-hidden
          />
          <span className="font-mono text-[10px] text-primary">live sync</span>
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative overflow-x-auto p-3 sm:p-4"
      >
        <div className="flex min-w-[36rem] gap-3">
          {HERO_COLUMNS.map((column, index) => {
            const tasks = tasksByColumn[column.key] ?? [];
            const showGhost =
              ANIMATED_TASK &&
              column.key === activeStatus &&
              !reducedMotion;

            return (
              <div
                key={column.key}
                ref={(node) => {
                  columnRefs.current[index] = node;
                }}
                className={cn(
                  "flex w-44 shrink-0 flex-col rounded-xl border border-border bg-surface sm:w-48",
                  "transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none",
                  mounted
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                )}
                style={{
                  transitionDelay: reducedMotion ? "0ms" : `${index * 80}ms`,
                }}
              >
                <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: columnAccent(column) }}
                    aria-hidden
                  />
                  <h3 className="text-xs font-medium text-text-primary sm:text-sm">
                    {column.name}
                  </h3>
                  <span className="ml-auto font-mono text-[10px] text-text-muted">
                    {column.key}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-2">
                  <div className="flex items-center justify-between px-1">
                    <PresenceDots columnKey={column.key} />
                    {column.isDone ? (
                      <span className="font-mono text-[9px] text-primary">
                        isDone: true
                      </span>
                    ) : null}
                  </div>

                  {tasks.map((task) => (
                    <MiniTaskCard key={task.id} task={task} />
                  ))}

                  {showGhost ? (
                    <MiniTaskCard task={ANIMATED_TASK} isGhost />
                  ) : null}

                  {tasks.length === 0 && !showGhost ? (
                    <p className="px-1 py-4 text-center text-[10px] text-text-muted">
                      Drop tasks here
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {ANIMATED_TASK && cardStyle && !reducedMotion ? (
          <div
            className={cn(
              "pointer-events-none absolute z-10",
              "transition-[left,top,transform] duration-500 ease-out motion-reduce:transition-none",
              isMoving && "scale-[1.03] rotate-1 shadow-xl"
            )}
            style={{
              left: cardStyle.left,
              top: cardStyle.top,
              width: cardStyle.width,
            }}
          >
            <div className="rounded-lg border-2 border-accent bg-surface-raised p-2.5 shadow-md">
              <p className="text-xs font-medium text-text-primary sm:text-sm">
                {ANIMATED_TASK.title}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className="rounded bg-accent-subtle px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                  style={{ color: getStatusColor(HERO_COLUMNS, activeStatus) }}
                >
                  {getStatusLabel(HERO_COLUMNS, activeStatus)}
                </span>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[9px] font-medium text-primary">
                  {memberInitials(ANIMATED_TASK.assignee?.name)}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {ANIMATED_TASK && reducedMotion ? (
          <div className="mt-3 border-t border-border pt-3">
            <MiniTaskCard task={ANIMATED_TASK} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
