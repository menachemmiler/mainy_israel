"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";
import { formatDateTimeHe } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Account = {
  id: string;
  labelHe: string;
  bankNameHe: string;
  branch: string;
  account: string;
  currency: string;
  currentBalance: string | null;
  lastSyncedAt: string | null;
  connection?: { status: string; writeAllowed: boolean; capabilityVerified: boolean } | null;
};

export default function BankingPage() {
  const [items, setItems] = useState<Account[]>([]);

  useEffect(() => {
    fetch("/api/banking/accounts")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div>
      <PageHeader title="חשבונות ויתרות" />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{a.labelHe}</div>
                <div className="text-sm text-[var(--muted)]">
                  {a.bankNameHe} · סניף {a.branch} · {a.account}
                </div>
              </div>
              {a.connection && <StatusBadge status={a.connection.status} />}
            </div>
            <div className="mt-3 text-2xl">
              <Money value={a.currentBalance} currency={a.currency} />
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              סנכרון: {a.lastSyncedAt ? formatDateTimeHe(a.lastSyncedAt) : "אין"} · כתיבה לבנק:{" "}
              {a.connection?.writeAllowed && a.connection?.capabilityVerified ? "מותרת" : "חסומה / מדומה"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
