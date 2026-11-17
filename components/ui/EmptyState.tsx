export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-start gap-3 p-8 text-right">
      <p className="text-[var(--muted)]">{title}</p>
      {action}
    </div>
  );
}
