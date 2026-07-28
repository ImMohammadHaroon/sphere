import { cn } from "@/lib/utils";
import { Users, FolderKanban } from "lucide-react";

function getUsagePercent(used, max) {
  if (!max) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

function UsageBar({ icon: Icon, label, used, max }) {
  const percent = getUsagePercent(used, max);
  const isNearLimit = percent >= 80;
  const isAtLimit = used >= max;

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Icon className="h-4 w-4 text-text-muted" />
          {label}
        </div>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isAtLimit ? "text-danger" : isNearLimit ? "text-warning" : "text-text-primary"
          )}
        >
          {used} / {max}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isAtLimit ? "bg-danger" : isNearLimit ? "bg-warning" : "bg-primary"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isNearLimit ? (
        <p className="mt-2 text-xs text-text-muted">
          {isAtLimit
            ? "Limit reached — upgrade your plan to add more."
            : "You're approaching your plan limit."}
        </p>
      ) : null}
    </div>
  );
}

export function UsageLimitsCard({ usage, limits }) {
  return (
    <div className="space-y-3">
      <UsageBar
        icon={Users}
        label="Team members"
        used={usage.users}
        max={limits.maxUsers}
      />
      <UsageBar
        icon={FolderKanban}
        label="Projects"
        used={usage.projects}
        max={limits.maxProjects}
      />
    </div>
  );
}
