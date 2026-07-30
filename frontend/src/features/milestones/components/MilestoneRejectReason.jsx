export function MilestoneRejectReason({ reason, className = "" }) {
  if (!reason?.trim()) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 ${className}`}
    >
      <p className="text-xs font-medium text-danger">Reject reason</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
        {reason}
      </p>
    </div>
  );
}
