import { Link } from "react-router-dom";

export function SummaryBreakdownList({ items = [] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => {
        const content = (
          <>
            <p className="font-medium text-text-primary">{item.label}</p>
            <p className="font-display text-lg font-semibold text-text-primary">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </p>
          </>
        );

        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
