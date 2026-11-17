"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";

type Contact = {
  displayName: string;
  city: string | null;
  nationalId: string | null;
  roles: { role: string }[];
  donations: { id: string; amount: string; currency: string; allocations: { amount: string; division: { nameHe: string } }[] }[];
  assignedTasks: { id: string; title: string }[];
};

export default function ContactCardPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Contact | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/contacts/${params.id}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setItem(d.item)));
  }, [params.id]);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!item) return <p>טוען…</p>;

  return (
    <div>
      <PageHeader title={item.displayName} />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="card p-4">
          <p className="text-sm text-[var(--muted)]">
            {item.city} · ת״ז {item.nationalId ?? "חסום / אין"} · {item.roles.map((r) => r.role).join(", ")}
          </p>
          <h2 className="mt-4 font-medium">ציר תרומות</h2>
          <p className="text-xs text-[var(--muted)]">תרומה מפוצלת נספרת פעם אחת בכרטיס, וההקצאות מוצגות לפי הרשאת האגף.</p>
          <ul className="mt-2 space-y-3">
            {item.donations.map((d) => (
              <li key={d.id} className="rounded-xl bg-[var(--bg)] p-3">
                <div>
                  סך התרומה: <Money value={d.amount} currency={d.currency} />
                </div>
                <ul className="mt-1 text-sm">
                  {d.allocations.map((a, i) => (
                    <li key={i}>
                      {a.division.nameHe}: <Money value={a.amount} currency={d.currency} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <aside className="card p-4">
          <h2 className="mb-2 font-medium">משימות פתוחות</h2>
          {item.assignedTasks.length === 0 && <p className="text-sm text-[var(--muted)]">אין משימות</p>}
          {item.assignedTasks.map((t) => (
            <div key={t.id} className="text-sm">
              {t.title}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
