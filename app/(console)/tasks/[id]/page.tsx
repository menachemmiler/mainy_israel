"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Money } from "@/components/ui/Money";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  result: string | null;
  version: number;
  amount: string | null;
  currency: string;
  contact?: { displayName: string } | null;
  events: { id: string; kind: string; note: string | null; createdAt: string }[];
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/tasks/${params.id}`);
    const data = await res.json();
    setTask(data.item);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function closeTask() {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE", note, result: note || "טופל", version: task.version }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error ?? "שגיאה");
    else {
      setMessage("המשימה נסגרה. מצב החיוב לא השתנה.");
      load();
    }
  }

  if (!task) return <p>טוען…</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <PageHeader
          title={task.title}
          actions={
            <button onClick={closeTask} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-white">
              סמן טופל
            </button>
          }
        />
        <div className="card space-y-3 p-4">
          <StatusBadge status={task.status} />
          <p>{task.description}</p>
          <p>
            תורם/ספק: {task.contact?.displayName ?? "—"} · סכום: <Money value={task.amount} currency={task.currency} />
          </p>
          <label className="block text-sm">
            מה נעשה ומה סוכם
            <textarea className="mt-1 w-full rounded-xl border p-2" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {message && <p className="text-sm text-[var(--ok)]">{message}</p>}
        </div>
      </div>
      <aside className="card p-4">
        <h2 className="mb-2 font-medium">היסטוריה</h2>
        <ul className="space-y-2 text-sm">
          {task.events.map((e) => (
            <li key={e.id}>
              <div className="text-[var(--muted)]">{e.kind}</div>
              <div>{e.note}</div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
