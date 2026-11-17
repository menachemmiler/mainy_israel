export function PageHeader({
  title,
  actions,
  filters,
}: {
  title: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions}
      </div>
      {filters}
    </div>
  );
}
