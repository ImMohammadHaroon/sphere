export function ClientProgressBar({ value, className = "" }) {
  const percent = Math.min(100, Math.max(0, value ?? 0));

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-surface ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
