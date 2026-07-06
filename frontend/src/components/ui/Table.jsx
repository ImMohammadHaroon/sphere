import { cn } from "@/lib/utils";

export function TableScrollArea({ className, children }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {children}
    </div>
  );
}

export function Table({ className, ...props }) {
  return (
    <table
      className={cn("w-full min-w-[36rem] caption-bottom text-sm", className)}
      {...props}
    />
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("border-b border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-surface/80",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-text-muted",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn("px-4 py-3 align-middle text-text-primary", className)}
      {...props}
    />
  );
}
