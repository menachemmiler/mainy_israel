"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DEV_LOGIN =
  process.env.NODE_ENV === "development"
    ? { email: "treasurer@mayanei.local", password: "MayaneiDemo1!" }
    : { email: "", password: "" };

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [email, setEmail] = useState(DEV_LOGIN.email);
  const [password, setPassword] = useState(DEV_LOGIN.password);
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
        <p className="mb-6 text-sm text-[var(--muted)]">כניסה למערכת הגזברות</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            דוא״ל <span className="text-[var(--danger)]">חובה</span>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="username"
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
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            disabled={pending}
            className="w-full rounded-xl bg-[var(--brand)] py-2.5 text-white disabled:opacity-60"
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="brand-spinner inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                מתחבר…
              </span>
            ) : (
              "כניסה"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">טוען…</div>}>
      <LoginForm />
    </Suspense>
  );
}
