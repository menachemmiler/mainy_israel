import { specForPath } from "@/lib/spec-guide";

export function SpecNote({ pathname }: { pathname: string }) {
  const spec = specForPath(pathname);
  if (!spec) return null;
  return (
    <div className="mb-4 rounded-xl border border-[var(--brand-2)]/45 bg-[color-mix(in_srgb,var(--brand-2)_12%,white)] px-4 py-3 text-sm">
      <div className="text-xs font-semibold text-[var(--brand)]">{spec.spec}</div>
      <p className="mt-1 text-[var(--muted)]">{spec.need}</p>
    </div>
  );
}
