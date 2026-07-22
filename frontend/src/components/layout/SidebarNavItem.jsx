import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function SidebarNavItem({ to, label, icon: Icon, isActive, badge }) {
  return (
    <li>
      <Link
        to={to}
        title={label}
        className={cn(
          "flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors lg:px-4",
          badge ? "lg:justify-between" : "lg:justify-start",
          isActive
            ? "bg-primary-subtle text-primary"
            : "text-text-secondary hover:bg-surface hover:text-text-primary"
        )}
      >
        <span className="flex items-center justify-center gap-3 lg:justify-start">
          <span className="relative shrink-0">
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {badge ? (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary lg:hidden"
                aria-hidden
              />
            ) : null}
          </span>
          <span className="hidden lg:inline">{label}</span>
        </span>
        {badge ? (
          <span
            className={cn(
              "hidden min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold lg:inline-flex",
              isActive
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary"
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
