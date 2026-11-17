import { allocationsBalance, money, Decimal } from "@/lib/money";

export type DonationSplit = {
  donationId: string;
  total: Decimal.Value;
  allocations: { divisionId: string; amount: Decimal.Value }[];
};

/** Organizational reports count a split donation once. Allocations must sum to the donation. */
export function summarizeDonations(rows: DonationSplit[]) {
  const uniqueIds = new Set(rows.map((r) => r.donationId));
  const problems = rows
    .map((r) => ({ donationId: r.donationId, ...allocationsBalance(r.total, r.allocations.map((a) => a.amount)) }))
    .filter((p) => !p.ok);

  const byDivision = new Map<string, Decimal>();
  for (const row of rows) {
    for (const a of row.allocations) {
      byDivision.set(a.divisionId, money(byDivision.get(a.divisionId) ?? 0).plus(money(a.amount)));
    }
  }

  return {
    organizationalCount: uniqueIds.size,
    allocationCount: rows.reduce((n, r) => n + r.allocations.length, 0),
    unbalanced: problems,
    byDivision: Object.fromEntries([...byDivision.entries()].map(([k, v]) => [k, v.toFixed(2)])),
  };
}
