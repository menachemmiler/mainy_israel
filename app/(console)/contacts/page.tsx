"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

type Contact = {
  id: string;
  displayName: string;
  city: string | null;
  nationalId: string | null;
  roles: { role: string }[];
  channels: { type: string; value: string }[];
};

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Contact[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/contacts?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <PageHeader
        title="אלפון"
        filters={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, משפחה או עיר"
            className="w-full max-w-md rounded-xl border border-[var(--line)] p-2"
          />
        }
      />
      <div className="grid gap-3 md:hidden">
        {items.map((c) => (
          <Link key={c.id} href={`/contacts/${c.id}`} className="card p-4">
            <div className="font-medium">{c.displayName}</div>
            <div className="text-sm text-[var(--muted)]">
              {c.city} · {c.nationalId ?? "ללא ת״ז"}
            </div>
          </Link>
        ))}
      </div>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="p-3 text-right">שם</th>
              <th className="p-3 text-right">עיר</th>
              <th className="p-3 text-right">תפקידים</th>
              <th className="p-3 text-right">קשר</th>
              <th className="p-3 text-right">ת״ז</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-[var(--line)]">
                <td className="p-3">
                  <Link className="underline" href={`/contacts/${c.id}`}>
                    {c.displayName}
                  </Link>
                </td>
                <td className="p-3">{c.city}</td>
                <td className="p-3">{c.roles.map((r) => r.role).join(", ")}</td>
                <td className="p-3">{c.channels[0]?.value}</td>
                <td className="p-3">{c.nationalId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
