import { formatMoney, type MoneyCurrency } from "@/lib/money";

export function Money({
  value,
  currency = "ILS",
}: {
  value: string | number | null | undefined;
  currency?: MoneyCurrency | string;
}) {
  if (value == null || value === "") return <span>—</span>;
  const cur = (currency as MoneyCurrency) ?? "ILS";
  return <span className="tabular-nums">{formatMoney(value, cur)}</span>;
}
