"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";
import { formatDateHe } from "@/lib/dates";

type Movement = {
  id: string;
  valueDate: string;
  amount: string;
  currency: string;
  actionCode: string | null;
  description: string | null;
  beneficiaryName: string | null;
  bankAccount: { labelHe: string };
};

export default function MovementsPage() {
  const [items, setItems] = useState<Movement[]>([]);

  useEffect(() => {
    fetch("/api/banking/movements")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div>
      <PageHeader title="תנועות בנק" />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="p-3 text-right">תאריך ערך</th>
              <th className="p-3 text-right">חשבון</th>
              <th className="p-3 text-right">קוד</th>
              <th className="p-3 text-right">תיאור</th>
              <th className="p-3 text-right">מוטב</th>
              <th className="p-3 text-right">סכום</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-[var(--line)]">
                <td className="p-3">{formatDateHe(m.valueDate)}</td>
                <td className="p-3">{m.bankAccount.labelHe}</td>
                <td className="p-3">{m.actionCode}</td>
                <td className="p-3">{m.description}</td>
                <td className="p-3">{m.beneficiaryName}</td>
                <td className="p-3">
                  <Money value={m.amount} currency={m.currency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
