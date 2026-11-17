"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import usersFile from "@/data/users.json";

const DEMOS = usersFile.users
  .filter((u) => u.showOnLogin)
  .map((u) => [u.email, u.loginLabel ?? u.nameHe] as const);

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [email, setEmail] = useState("treasurer@mayanei.local");
  const [password, setPassword] = useState("MayaneiDemo1!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "ההתחברות נכשלה");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="card p-8">
        <h1 className="mb-1 text-2xl font-semibold">מעייני ישראל</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">כניסה למערכת הגזברות · חשבונות דמו</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            דוא״ל <span className="text-[var(--danger)]">חובה</span>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="block text-sm">
            סיסמה <span className="text-[var(--danger)]">חובה</span>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            disabled={pending}
            className="w-full rounded-xl bg-[var(--brand)] py-2.5 text-white disabled:opacity-60"
          >
            {pending ? "מתחבר…" : "כניסה"}
          </button>
        </form>
        <div className="mt-6 text-xs text-[var(--muted)]">
          <div className="mb-2 font-medium text-[var(--ink)]">חשבונות דמו (סיסמה אחת: MayaneiDemo1!)</div>
          {DEMOS.map(([em, label]) => (
            <button
              key={em}
              type="button"
              className="mb-1 block underline"
              onClick={() => setEmail(em)}
            >
              {label} — {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
