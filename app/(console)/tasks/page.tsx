"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Money } from "@/components/ui/Money";
import { formatDateHe } from "@/lib/dates";

const TABS = [
  ["open", "לטיפול"],
  ["done", "טופלו"],
];

type Task = {
  id: string;
  type: string;
  title: string;
  status: string;
  amount: string | null;
  currency: string;
  dueAt: string | null;
  contact?: { displayName: string } | null;
  assignee?: { nameHe: string } | null;
};

export default function TasksPage() {
  const [tab, setTab] = useState("open");
  const [items, setItems] = useState<Task[]>([]);

  useEffect(() => {
    fetch(`/api/tasks?tab=${tab}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [tab]);

  return (
    <div>
      <PageHeader
        title="תיבת משימות"
        filters={
          <div className="flex gap-2">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-full px-3 py-1 text-sm ${tab === id ? "bg-[var(--brand)] text-white" : "bg-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[var(--muted)]">
            <tr>
              <th className="p-3 text-right">סוג</th>
              <th className="p-3 text-right">משימה</th>
              <th className="p-3 text-right">תורם / ספק</th>
              <th className="p-3 text-right">סכום</th>
              <th className="p-3 text-right">אחראי</th>
              <th className="p-3 text-right">יעד</th>
              <th className="p-3 text-right">מצב</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-[var(--line)]">
                <td className="p-3">{t.type}</td>
                <td className="p-3">
                  <Link className="underline" href={`/tasks/${t.id}`}>
                    {t.title}
                  </Link>
                </td>
                <td className="p-3">{t.contact?.displayName ?? "—"}</td>
                <td className="p-3">
                  <Money value={t.amount} currency={t.currency} />
                </td>
                <td className="p-3">{t.assignee?.nameHe ?? "ללא אחראי"}</td>
                <td className="p-3">{formatDateHe(t.dueAt)}</td>
                <td className="p-3">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-[var(--muted)]">אין משימות בתור זה. צרו משימה ידנית או ייבאו לידים.</p>}
      </div>
    </div>
  );
}
