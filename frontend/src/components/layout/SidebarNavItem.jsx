import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function SidebarNavItem({ to, label, icon: Icon, isActive, badge }) {
  return (
    <li>
      <Link
        to={to}
        title={label}
        className={cn(
          "flex items-center justify-center gap-3 border-l-[3px] py-2.5 pl-[calc(0.5rem-3px)] pr-2 text-sm font-medium transition-colors lg:pl-[calc(1rem-3px)] lg:pr-4",
          badge ? "lg:justify-between" : "lg:justify-start",
          isActive
            ? "border-l-primary bg-sidebar-active-bg text-sidebar-active-text"
            : "border-l-transparent text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-hover"
        )}
      >
        <span className="flex items-center justify-center gap-3 lg:justify-start">
          <span className="relative shrink-0">
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {badge ? (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-dashboard-accent lg:hidden"
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
                ? "bg-primary text-primary-foreground"
                : "bg-sidebar-hover text-sidebar-text"
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
