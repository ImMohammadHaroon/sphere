import { Link } from "react-router-dom";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
        accent:
          "border-0 bg-[hsl(var(--accent))] text-white shadow-sm hover:opacity-90",
        info:
          "border-0 bg-info text-white shadow-sm hover:opacity-90",
        secondary:
          "border-0 bg-[hsl(var(--kanban-purple))] text-white shadow-sm hover:opacity-90",
        outline:
          "border border-border-strong bg-surface text-text-primary hover:bg-card-hover shadow-sm",
        ghost:
          "text-text-secondary hover:bg-card-hover hover:text-text-primary",
        danger: "bg-danger text-white hover:opacity-90 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export function ButtonLink({
  className,
  variant,
  size,
  children,
  ...props
}) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Link>
  );
}

export { buttonVariants };
