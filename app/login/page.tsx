"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Identity = {
  email: string;
  nameHe: string;
  loginLabel: string;
  specRef: string;
  summaryHe: string;
  role: string;
};

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [items, setItems] = useState<Identity[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/identities")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setNotice(d.notice ?? "");
      })
      .catch(() => setError("לא ניתן לטעון את רשימת ההרשאות"));
  }, []);

  async function enterAs(identityEmail: string, extras?: { password?: string; demoPick?: boolean }) {
    setPendingEmail(identityEmail);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: identityEmail,
        demoPick: extras?.demoPick ?? true,
        password: extras?.password,
      }),
    });
    setPendingEmail("");
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "ההתחברות נכשלה");
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    await enterAs(email, { password, demoPick: false });
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">מעייני ישראל</h1>
        <p className="mt-1 text-[var(--muted)]">מערכת הגזברות · הדגמה לפי האפיון המלא</p>
      </div>

      <div className="card mb-6 p-4 text-sm leading-6">
        <p className="font-medium text-[var(--brand)]">בחרו הרשאה מהרשימה — בלי סיסמה</p>
        <p className="mt-1 text-[var(--muted)]">
          {notice ||
            "מוצגים המיילים של כל בעלי ההרשאות מחלק א §1. הנתונים מדומים; חיבור הבנק עדיין לא פעיל. כך אפשר לראות מה כל תפקיד רואה."}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        {items.map((item) => {
          const busy = pendingEmail === item.email;
          return (
            <button
              key={item.email}
              type="button"
              disabled={Boolean(pendingEmail)}
              onClick={() => enterAs(item.email)}
              className="card p-4 text-right transition hover:border-[var(--brand)] disabled:opacity-60"
            >
              <div className="text-xs font-medium text-[var(--brand)]">{item.specRef}</div>
              <div className="mt-1 text-lg font-semibold">{item.loginLabel}</div>
              <div className="text-sm">{item.nameHe}</div>
              <div className="mt-1 font-mono text-xs text-[var(--muted)]" dir="ltr">
                {item.email}
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.summaryHe}</p>
              <div className="mt-3 text-sm font-medium text-[var(--brand)]">
                {busy ? "נכנס…" : "כניסה בהרשאה זו"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <button
          type="button"
          className="text-sm text-[var(--muted)] underline"
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? "הסתר כניסה עם סיסמה" : "כניסה עם סיסמה (לא נדרש להדגמה)"}
        </button>
        {showPassword && (
          <form onSubmit={onPasswordSubmit} className="card mt-3 max-w-md space-y-3 p-4">
            <label className="block text-sm">
              דוא״ל
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
              סיסמה
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button
              disabled={Boolean(pendingEmail)}
              className="w-full rounded-xl bg-[var(--brand)] py-2.5 text-white disabled:opacity-60"
            >
              כניסה
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">טוען…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
