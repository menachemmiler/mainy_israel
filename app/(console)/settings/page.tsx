"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoading } from "@/components/ui/PageLoading";

type Preview = {
  user: { nameHe: string; email: string };
  roles: { labelHe: string }[];
  restrictions: { field: string; domain: string }[];
  matrix: {
    domainHe: string;
    actions: { actionHe: string; allowed: boolean; reason: string }[];
  }[];
};

export default function SettingsPage() {
  const [users, setUsers] = useState<{ id: string; nameHe: string; email: string }[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then(() => fetch("/api/auth/me"))
      .then((r) => r.json())
      .then(async () => {
        const res = await fetch("/api/settings/users");
        if (res.ok) setUsers((await res.json()).items ?? []);
      });
  }, []);

  async function loadPreview(userId: string) {
    const res = await fetch(`/api/settings/access-preview?userId=${userId}`);
    setPreview(await res.json());
  }

  return (
    <div>
      <PageHeader title="הגדרות והרשאות" />
      <p className="mb-4 text-sm text-[var(--muted)]">תצוגת ״מה המשתמש יראה״ לפי תחום ופעולה, עם הכלל שמכריע.</p>
      <UsersLoader onLoaded={setUsers} onPick={loadPreview} users={users} />
      {preview && (
        <div className="card mt-4 overflow-x-auto p-4">
          <h2 className="font-medium">
            {preview.user?.nameHe} · {preview.roles?.map((r) => r.labelHe).join(", ")}
          </h2>
          {preview.restrictions?.length > 0 && (
            <p className="text-sm text-[var(--danger)]">
              הגבלות: {preview.restrictions.map((r) => `${r.domain}.${r.field}`).join(", ")}
            </p>
          )}
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-right">תחום</th>
                {preview.matrix[0]?.actions.map((a) => (
                  <th key={a.actionHe} className="p-2">
                    {a.actionHe}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.matrix.map((row) => (
                <tr key={row.domainHe} className="border-t border-[var(--line)]">
                  <td className="p-2">{row.domainHe}</td>
                  {row.actions.map((a) => (
                    <td key={a.actionHe} className="p-2" title={a.reason}>
                      {a.allowed ? "כן" : "לא"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersLoader({
  users,
  onLoaded,
  onPick,
}: {
  users: { id: string; nameHe: string; email: string }[];
  onLoaded: (u: { id: string; nameHe: string; email: string }[]) => void;
  onPick: (id: string) => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fetch("/api/settings/users")
      .then((r) => r.json())
      .then((d) => onLoaded(d.items ?? []))
      .finally(() => setReady(true));
  }, [onLoaded]);
  if (!ready) {
    return <PageLoading variant="table" />;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {users.map((u) => (
        <button key={u.id} className="rounded-full bg-white px-3 py-1 text-sm" onClick={() => onPick(u.id)}>
          {u.nameHe}
        </button>
      ))}
    </div>
  );
}
