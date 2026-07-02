import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Alert({ variant = "info", children, className }) {
  const styles = {
    error: "border-danger/30 bg-danger/10 text-danger",
    success: "border-success/30 bg-success/10 text-success",
    info: "border-info/30 bg-info/10 text-info",
  };

  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        styles[variant],
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
