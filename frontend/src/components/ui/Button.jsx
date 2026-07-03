import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/ButtonLink";

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
