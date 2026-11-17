"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";
import { formatDateHe, formatDateTimeHe } from "@/lib/dates";
import { CERTAINTY_ORDER, type Certainty } from "@/lib/cashflow/forecast";

const CERTAINTY_LABEL: Record<Certainty, string> = {
  CONFIRMED: "מאומת",
  HIGH: "גבוהה",
  MEDIUM: "בינונית",
  LOW: "נמוכה",
};

type DayRow = {
  date: string;
  opening: string;
  inflow: string;
  outflow: string;
  closing: string;
  available: string;
  items: {
    id: string;
    description: string;
    sourceLabelHe: string;
    amount: string;
    direction: "IN" | "OUT";
    certainty: Certainty;
    ownerHe: string;
    shifted?: boolean;
  }[];
};

type Decision = {
  id: string;
  kind: string;
  titleHe: string;
  detailHe: string;
  amount: string;
  date: string | null;
  ownerHe: string;
};

type Payload = {
  cutoff: string;
  refreshedAt: string | null;
  account: { labelHe: string; currency: string };
  openingBalance: string;
  restricted: { fund: string; amount: string; noteHe: string }[];
  restrictedTotal: string;
  creditLine: string;
  availableNow: string;
  currencyPolicyHe: string;
  scenarios: { id: string; labelHe: string; kind: string }[];
  scenario: { id: string; labelHe: string; kind: string };
  current: {
    series: DayRow[];
    undated: { id: string; description: string; amount: string; ownerHe: string }[];
    trough: { date: string; balance: string };
    daysInDeficit: number;
    daysAvailableNegative: number;
    decisions: Decision[];
  };
  baseline: { trough: { date: string; balance: string }; daysInDeficit: number };
};

function Metric({
  label,
  value,
  currency = "ILS",
  hint,
  danger,
}: {
  label: string;
  value: string;
  currency?: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className={`mt-1 text-xl tabular-nums ${danger ? "text-[var(--danger)]" : ""}`}>
        <Money value={value} currency={currency} />
      </div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

function DailyChart({
  series,
  selected,
  onSelect,
}: {
  series: DayRow[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const width = 720;
  const height = 160;
  const pad = 16;
  const values = series.map((d) => Number(d.closing));
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(series.length - 1, 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const zeroY = y(0);
  const points = series.map((d, i) => `${x(i)},${y(Number(d.closing))}`).join(" ");
  const trough = series.reduce((best, d) => (Number(d.closing) < Number(best.closing) ? d : best), series[0]);

  if (!series.length) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="יתרה חזויה לפי יום">
      <line x1={pad} x2={width - pad} y1={zeroY} y2={zeroY} stroke="#ddd4c4" strokeDasharray="4 4" />
      <polyline fill="none" stroke="#1f4d3a" strokeWidth="2.5" points={points} />
      {series.map((d, i) => (
        <circle
          key={d.date}
          cx={x(i)}
          cy={y(Number(d.closing))}
          r={selected === d.date ? 5 : 3}
          fill={Number(d.closing) < 0 ? "#9b2c2c" : d.date === trough.date ? "#9a6700" : "#1f4d3a"}
          className="cursor-pointer"
          onClick={() => onSelect(d.date)}
        />
      ))}
    </svg>
  );
}

export default function CashflowPage() {
  const [scenario, setScenario] = useState("base");
  const [horizon, setHorizon] = useState(21);
  const [certainty, setCertainty] = useState<Certainty[]>([...CERTAINTY_ORDER]);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({
      scenario,
      horizon: String(horizon),
      certainty: certainty.join(","),
      currency: "ILS",
    });
    const res = await fetch(`/api/banking/cashflow?${params}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "לא ניתן לטעון את התזרים");
      setData(null);
      return;
    }
    setData(body);
    setSelected((current) => current ?? body.current?.trough?.date ?? null);
  }, [scenario, horizon, certainty]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleCertainty(level: Certainty) {
    setCertainty((prev) =>
      prev.includes(level) ? prev.filter((c) => c !== level) : [...prev, level],
    );
  }

  function onScenario(id: string) {
    setScenario(id);
    if (id === "conservative") setCertainty(["CONFIRMED", "HIGH"]);
    else setCertainty([...CERTAINTY_ORDER]);
  }

  async function act(action: "save" | "apply") {
    setPending(true);
    setNotice("");
    const res = await fetch("/api/banking/cashflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, scenarioId: scenario }),
    });
    const body = await res.json();
    setPending(false);
    setNotice(body.notice ?? body.error ?? "בוצע");
  }

  const selectedDay = useMemo(
    () => data?.current.series.find((d) => d.date === selected) ?? null,
    [data, selected],
  );

  if (error) {
    return (
      <div>
        <PageHeader title="תזרים ותרחישים" />
        <div className="card p-6 text-[var(--danger)]">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="תזרים ותרחישים" />
        <p className="text-[var(--muted)]">טוען תחזית…</p>
      </div>
    );
  }

  const deficit = data.current.daysInDeficit > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="תזרים ותרחישים"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => act("save")}
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              שמור תרחיש
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act("apply")}
              className="rounded-xl bg-[var(--brand)] px-3 py-2 text-sm text-white"
            >
              אשר שינוי
            </button>
          </div>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {data.scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onScenario(s.id)}
                className={`rounded-full px-3 py-1 ${
                  scenario === s.id ? "bg-[var(--brand)] text-white" : "bg-white border border-[var(--line)]"
                }`}
              >
                {s.labelHe}
              </button>
            ))}
            <span className="mx-2 text-[var(--muted)]">|</span>
            {[7, 21, 31].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setHorizon(n)}
                className={`rounded-full px-3 py-1 ${
                  horizon === n ? "bg-[var(--brand)] text-white" : "bg-white border border-[var(--line)]"
                }`}
              >
                {n === 7 ? "שבוע" : n === 21 ? "שלושה שבועות" : "חודש"}
              </button>
            ))}
          </div>
        }
      />

      {notice && <div className="rounded-xl bg-[#fff4d6] p-3 text-sm">{notice}</div>}

      <p className="text-xs text-[var(--muted)]">
        {data.account.labelHe} · חתך {formatDateHe(data.cutoff)} · רענון{" "}
        {formatDateTimeHe(data.refreshedAt)} · {data.currencyPolicyHe}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="יתרה מאומתת" value={data.openingBalance} hint={data.account.labelHe} />
        <Metric label="כספים מוגבלים" value={data.restrictedTotal} hint={data.restricted[0]?.noteHe} />
        <Metric label="מסגרת" value={data.creditLine} />
        <Metric
          label="יתרה זמינה"
          value={data.availableNow}
          danger={Number(data.availableNow) < 0}
          hint="יתרת בנק פחות כספים מוגבלים"
        />
        <Metric
          label="נקודת שפל"
          value={data.current.trough.balance}
          danger={Number(data.current.trough.balance) < 0}
          hint={formatDateHe(data.current.trough.date)}
        />
        <div className="card p-4">
          <div className="text-xs text-[var(--muted)]">ימים בחריגה</div>
          <div className={`mt-1 text-xl tabular-nums ${deficit ? "text-[var(--danger)]" : ""}`}>
            {data.current.daysInDeficit}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {scenario !== "base"
              ? `בסיס: ${data.baseline.daysInDeficit} ימים · שפל ${data.baseline.trough.balance}`
              : `${data.current.daysAvailableNegative} ימים מתחת לזמין החופשי`}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {CERTAINTY_ORDER.map((level) => (
          <label key={level} className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1">
            <input
              type="checkbox"
              checked={certainty.includes(level)}
              onChange={() => toggleCertainty(level)}
            />
            ודאות {CERTAINTY_LABEL[level]}
          </label>
        ))}
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">יתרה חזויה</span>
          <span className="text-[var(--muted)]">לחיצה על נקודה מסננת את הטבלה ליום</span>
        </div>
        <DailyChart series={data.current.series} selected={selected} onSelect={setSelected} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="p-3 text-right">תאריך</th>
                <th className="p-3 text-right">יתרת פתיחה</th>
                <th className="p-3 text-right">תקבולים</th>
                <th className="p-3 text-right">תשלומים</th>
                <th className="p-3 text-right">יתרת סגירה</th>
                <th className="p-3 text-right">זמין</th>
              </tr>
            </thead>
            <tbody>
              {data.current.series.map((row) => (
                <tr
                  key={row.date}
                  className={`cursor-pointer border-t border-[var(--line)] ${
                    selected === row.date ? "bg-[#e8f6ee]" : ""
                  } ${Number(row.closing) < 0 ? "text-[var(--danger)]" : ""}`}
                  onClick={() => setSelected(row.date)}
                >
                  <td className="p-3">{formatDateHe(row.date)}</td>
                  <td className="p-3">
                    <Money value={row.opening} />
                  </td>
                  <td className="p-3">
                    <Money value={row.inflow} />
                  </td>
                  <td className="p-3">
                    <Money value={row.outflow} />
                  </td>
                  <td className="p-3 font-medium">
                    <Money value={row.closing} />
                  </td>
                  <td className="p-3">
                    <Money value={row.available} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-3 font-medium">לוח החלטות</h2>
            <div className="space-y-3">
              {data.current.decisions.map((d) => (
                <div key={d.id} className="border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{d.titleHe}</div>
                      <div className="text-xs text-[var(--muted)]">{d.detailHe}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        {d.ownerHe}
                        {d.date ? ` · ${formatDateHe(d.date)}` : " · קבע מועד"}
                      </div>
                    </div>
                    <Money value={d.amount} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 font-medium">פירוט היום</h2>
            {!selectedDay || selectedDay.items.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">אין תנועות צפויות ביום שנבחר.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {selectedDay.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div>{item.description}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {item.sourceLabelHe} · ודאות {CERTAINTY_LABEL[item.certainty]} · {item.ownerHe}
                        {item.shifted ? " · הוזז בתרחיש" : ""}
                      </div>
                    </div>
                    <span className={item.direction === "OUT" ? "text-[var(--danger)]" : "text-[var(--ok)]"}>
                      {item.direction === "OUT" ? "−" : "+"}
                      <Money value={item.amount} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
