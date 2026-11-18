"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Money } from "@/components/ui/Money";
import { PageLoading } from "@/components/ui/PageLoading";

type Draft = {
  id: string;
  kind: string;
  status: string;
  amount: string;
  currency: string;
  writeMode: string;
  bankTransactionId: string | null;
  bankAccount: { labelHe: string };
};

export default function DraftsPage() {
  const [items, setItems] = useState<Draft[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; labelHe: string }[]>([]);
  const [notice, setNotice] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [d, a] = await Promise.all([fetch("/api/banking/drafts"), fetch("/api/banking/accounts")]);
    const drafts = await d.json();
    const acc = await a.json();
    setItems(drafts.items ?? []);
    setAccounts(acc.items ?? []);
    if (!accountId && acc.items?.[0]) setAccountId(acc.items[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/banking/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "SINGLE",
        bankAccountId: accountId,
        idempotencyKey: `ui-${Date.now()}`,
        bank: form.get("bank"),
        branch: form.get("branch"),
        account: form.get("account"),
        beneficiary_name: form.get("beneficiary_name"),
        amount: form.get("amount"),
        transfer_date: form.get("transfer_date"),
        comment: form.get("comment"),
      }),
    });
    const data = await res.json();
    setNotice(data.notice ?? data.error ?? "נשמר");
    load();
  }

  if (loading) {
    return <PageLoading title="טיוטות העברה" variant="table" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <PageHeader title="טיוטות העברה" />
        <div className="mb-3 rounded-xl bg-[#fff4d6] p-3 text-sm">
          כפתור השליחה במצב <strong>בדיקת ספק / מדומה</strong>. אין שידור לבנק עד שאימות FIBI יושלם. חתימה סופית נשארת
          בפורטל הבנק.
        </div>
        <div className="card divide-y divide-[var(--line)]">
          {items.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div>
                  {d.kind === "BATCH" ? "אצווה" : "העברה בודדת"} · {d.bankAccount.labelHe}
                </div>
                <div className="text-xs text-[var(--muted)]">{d.bankTransactionId ?? "אין מזהה בנק"}</div>
              </div>
              <div className="flex items-center gap-3">
                <Money value={d.amount} currency={d.currency} />
                <StatusBadge status={d.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <form className="card space-y-3 p-4" onSubmit={onSubmit}>
        <h2 className="font-medium">טיוטה בודדת (מדומה)</h2>
        <select className="w-full rounded-xl border p-2" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.labelHe}
            </option>
          ))}
        </select>
        <input name="beneficiary_name" required placeholder="שם מוטב" className="w-full rounded-xl border p-2" />
        <div className="grid grid-cols-3 gap-2">
          <input name="bank" required placeholder="בנק 2 ספרות" defaultValue="12" className="rounded-xl border p-2" />
          <input name="branch" required placeholder="סניף" defaultValue="345" className="rounded-xl border p-2" />
          <input name="account" required placeholder="חשבון" defaultValue="12345678" className="rounded-xl border p-2" />
        </div>
        <input name="amount" required placeholder="סכום" defaultValue="100.00" className="w-full rounded-xl border p-2" />
        <input name="transfer_date" type="date" required className="w-full rounded-xl border p-2" />
        <input name="comment" placeholder="הערה לבנק" className="w-full rounded-xl border p-2" />
        <button className="w-full rounded-xl bg-[var(--brand)] py-2 text-white">הכן טיוטה מדומה</button>
        {notice && <p className="text-sm">{notice}</p>}
      </form>
    </div>
  );
}
