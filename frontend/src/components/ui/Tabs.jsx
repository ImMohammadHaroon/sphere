import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext(null);

export function Tabs({
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange, orientation }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  const ctx = useContext(TabsContext);
  const isVertical = ctx?.orientation === "vertical";

  return (
    <div
      className={cn(
        isVertical
          ? "flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-border p-3 sm:flex-col sm:gap-0 sm:overflow-visible sm:border-b-0 sm:border-r sm:p-4 lg:w-56"
          : "mb-6 flex flex-wrap gap-1 border-b border-border pb-px",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  const isVertical = ctx?.orientation === "vertical";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        "text-sm font-medium transition-colors",
        isVertical
          ? cn(
              "shrink-0 rounded-lg px-3 py-2 sm:w-full sm:text-left",
              isActive
                ? "bg-primary-subtle text-primary"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
            )
          : cn(
              "rounded-t-lg px-4 py-2",
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            ),
        className
      )}
      onClick={() => ctx?.onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
