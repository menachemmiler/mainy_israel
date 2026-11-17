"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";
import { formatDateTimeHe } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/StatusBadge";

type HomeData = {
  bankSyncedAt: string | null;
  balances: { id: string; labelHe: string; currency: string; currentBalance: string | null; balanceAsOf: string | null }[];
  openTasks: number;
  overdueTasks: number;
  pendingCollections: number;
  drafts: { id: string; status: string; amount: string; listName: string | null }[];
};

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError("לא ניתן לטעון את הבית"));
  }, []);

  return (
    <div>
      <PageHeader
        title="בית גזבר"
        filters={
          <p className="text-sm text-[var(--muted)]">
            עדכון בנק אחרון: {data?.bankSyncedAt ? formatDateTimeHe(data.bankSyncedAt) : "טרם סונכרן"}
          </p>
        }
      />
      {error && <p className="text-[var(--danger)]">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Tile href="/banking" title="יתרות">
          {data?.balances.map((b) => (
            <div key={b.id} className="flex justify-between text-sm">
              <span>{b.labelHe}</span>
              <Money value={b.currentBalance} currency={b.currency} />
            </div>
          ))}
        </Tile>
        <Tile href="/tasks" title="משימות פתוחות" value={data?.openTasks} />
        <Tile href="/tasks?tab=open" title="באיחור" value={data?.overdueTasks} tone="danger" />
        <Tile href="/fundraising" title="גבייה ממתינה" value={data?.pendingCollections} />
      </div>
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium">אצוות וטיוטות בנק</h2>
        <div className="card divide-y divide-[var(--line)]">
          {(data?.drafts ?? []).length === 0 && <p className="p-4 text-sm text-[var(--muted)]">אין טיוטות פתוחות</p>}
          {data?.drafts.map((d) => (
            <Link key={d.id} href="/banking/drafts" className="flex items-center justify-between p-4">
              <span>{d.listName ?? "העברה בודדת"}</span>
              <span className="flex items-center gap-3">
                <Money value={d.amount} />
                <StatusBadge status={d.status} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({
  title,
  href,
  value,
  children,
  tone,
}: {
  title: string;
  href: string;
  value?: number;
  children?: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <Link href={href} className="card block p-4">
      <div className="mb-2 text-sm text-[var(--muted)]">{title}</div>
      {value != null && (
        <div className={`text-2xl font-semibold ${tone === "danger" ? "text-[var(--danger)]" : ""}`}>{value}</div>
      )}
      <div className="space-y-1">{children}</div>
    </Link>
  );
}
