"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Connection = {
  id: string;
  provider: string;
  labelHe: string;
  status: string;
  accessExists: boolean;
  dataRead: boolean;
  writeAllowed: boolean;
  capabilityVerified: boolean;
  bankAccount?: { labelHe: string } | null;
};

export default function ConnectionsPage() {
  const [items, setItems] = useState<Connection[]>([]);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div>
      <PageHeader title="מרכז חיבורים" />
      <p className="mb-4 text-sm text-[var(--muted)]">
        מודל גנרי: FIBI בגרסה 1. מחבר פאג״י יתווסף באותה טבלה בלי לשנות את ליבת ההרשאות.
      </p>
      <div className="grid gap-4">
        {items.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.labelHe}</div>
                <div className="text-sm text-[var(--muted)]">
                  {c.provider} · {c.bankAccount?.labelHe}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <Flag on={c.accessExists} label="גישה קיימת" />
              <Flag on={c.dataRead} label="נקראו נתונים" />
              <Flag on={c.writeAllowed} label="מותרת כתיבה" />
              <Flag on={c.capabilityVerified} label="יכולת אומתה" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <div className={on ? "status-ok rounded-xl px-2 py-1" : "status-muted rounded-xl px-2 py-1"}>
      {label}: {on ? "כן" : "לא"}
    </div>
  );
}
