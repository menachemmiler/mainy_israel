function Bone({ className }: { className: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

function BrandMark() {
  return (
    <div className="relative h-11 w-11 shrink-0" aria-hidden>
      <span className="absolute inset-0 rounded-full border border-[var(--line)]" />
      <span className="brand-spinner absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--brand)] border-r-[var(--brand-2)]" />
      <span className="absolute inset-[9px] rounded-full bg-[var(--brand)]/10" />
      <span className="absolute inset-[14px] rounded-full bg-[var(--brand-2)]" />
    </div>
  );
}

function LoadingCaption() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <BrandMark />
      <div>
        <p className="text-sm font-medium">טוען נתונים</p>
        <p className="text-xs text-[var(--muted)]">מושך רשומות ממסד הנתונים…</p>
      </div>
    </div>
  );
}

function DashboardBones() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-4">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-28" />
            <Bone className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="card mt-6 space-y-3 p-4">
        <Bone className="h-4 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Bone className="h-3 w-1/2" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}

function TableBones() {
  return (
    <div className="card overflow-hidden p-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] px-3 py-3 last:border-0">
          <Bone className="h-3 w-16" />
          <Bone className="h-3 flex-1" />
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function CardsBones() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="flex justify-between">
            <Bone className="h-4 w-40" />
            <Bone className="h-5 w-16" />
          </div>
          <Bone className="h-8 w-32" />
          <Bone className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function DetailBones() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="card space-y-4 p-4">
        <Bone className="h-4 w-48" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <Bone className="h-24 w-full" />
      </div>
      <div className="card space-y-3 p-4">
        <Bone className="h-4 w-28" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-2/3" />
        <Bone className="h-3 w-full" />
      </div>
    </div>
  );
}

const VARIANTS = {
  dashboard: DashboardBones,
  table: TableBones,
  cards: CardsBones,
  detail: DetailBones,
};

export function PageLoading({
  title,
  variant = "dashboard",
}: {
  title?: string;
  variant?: keyof typeof VARIANTS;
}) {
  const Bones = VARIANTS[variant];
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      {title ? <h1 className="mb-4 text-2xl font-semibold">{title}</h1> : null}
      <LoadingCaption />
      <Bones />
      <span className="sr-only">טוען נתונים ממסד הנתונים</span>
    </div>
  );
}
