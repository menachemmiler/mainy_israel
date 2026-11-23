"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageLoading } from "@/components/ui/PageLoading";

type Connection = {
  id: string;
  provider: string;
  labelHe: string;
  status: string;
  accessExists: boolean;
  dataRead: boolean;
  writeAllowed: boolean;
  capabilityVerified: boolean;
  bankAccount?: { id: string; labelHe: string } | null;
};

function ConnectionsInner() {
  const search = useSearchParams();
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [notice, setNotice] = useState(search.get("oauth") === "ok" ? "Refresh Token נשמר מוצפן. Access Token תקף ל־20 דקות." : "");
  const [error, setError] = useState(search.get("oauth") === "error" ? search.get("message") ?? "החיבור נכשל" : "");

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d) => {
        const rows = d.items ?? [];
        setItems(rows);
        const first = rows.find((c: Connection) => c.bankAccount?.id)?.bankAccount?.id;
        if (first) setAccountId(first);
      })
      .finally(() => setLoading(false));
  }, []);

  async function onPaste(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await fetch("/api/fibi/oauth/import-refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankAccountId: accountId, refreshToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "לא ניתן לשמור את הטוקן");
      return;
    }
    setToken("");
    setNotice("Refresh Token נשמר מוצפן מתוך הפורטל.");
    const again = await fetch("/api/integrations");
    setItems((await again.json()).items ?? []);
  }

  if (loading) {
    return <PageLoading title="מרכז חיבורים" variant="cards" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="מרכז חיבורים" />
      <p className="text-sm text-[var(--muted)]">
        לפי סעיף 1.4.2: הכפתור מפנה את מנהל הכספים ל־OAuth2/Authorize. בפורטל הבנק הוא מזדהה בסיסמה + OTP, ואנחנו
        מחליפים את ה־access_code ב־Refresh Token שנתי. כתובת ה־Redirect חייבת להיות זהה לקטלוג המפתחים.
      </p>

      {notice && <div className="rounded-xl bg-[#e8f6ee] p-3 text-sm">{notice}</div>}
      {error && <div className="rounded-xl bg-[#fde8e8] p-3 text-sm text-[var(--danger)]">{error}</div>}

      <div className="grid gap-4">
        {items.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{c.labelHe}</div>
                <div className="text-sm text-[var(--muted)]">
                  {c.provider} · {c.bankAccount?.labelHe}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} />
                {c.bankAccount?.id && (
                  <a
                    href={`/api/fibi/oauth/start?bankAccountId=${c.bankAccount.id}`}
                    className="rounded-xl bg-[var(--brand)] px-3 py-2 text-sm text-white"
                  >
                    התחבר לבנק לקבלת Refresh Token
                  </a>
                )}
              </div>
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

      <form className="card space-y-3 p-4" onSubmit={onPaste}>
        <h2 className="font-medium">הדבקת Refresh Token מהפורטל</h2>
        <p className="text-sm text-[var(--muted)]">
          אם נרשמתם ל־self-service token, הפורטל מציג את הטוקן בחלון. מדביקים אותו כאן במקום הזרימה עם Redirect.
        </p>
        <select
          className="w-full rounded-xl border border-[var(--line)] p-2"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {items
            .filter((c) => c.bankAccount?.id)
            .map((c) => (
              <option key={c.bankAccount!.id} value={c.bankAccount!.id}>
                {c.bankAccount!.labelHe}
              </option>
            ))}
        </select>
        <textarea
          className="min-h-24 w-full rounded-xl border border-[var(--line)] p-2"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Refresh Token"
          required
        />
        <button className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm text-white" type="submit">
          שמור טוקן
        </button>
      </form>
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

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<PageLoading title="מרכז חיבורים" variant="cards" />}>
      <ConnectionsInner />
    </Suspense>
  );
}
