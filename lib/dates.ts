const IL_TZ = "Asia/Jerusalem";

export function todayIl(date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Date(`${parts}T00:00:00.000Z`);
}

export function formatDateHe(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("he-IL", { timeZone: IL_TZ });
}

export function formatDateTimeHe(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("he-IL", { timeZone: IL_TZ });
}

export function formatRelativeHe(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const diffMin = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("he", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  return rtf.format(Math.round(diffHr / 24), "day");
}

export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isBusinessDayIl(_date: Date): boolean {
  // Stub: full holiday calendar lives in settings. Sun–Thu treated as business days for v1.
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: IL_TZ,
    weekday: "short",
  }).format(_date);
  return day !== "Fri" && day !== "Sat";
}

/**
 * Rule of 29 — only on paths explicitly marked (Part A default: off).
 * Start on the 29th or later moves the first payment to next month.
 */
export function applyRule29(start: Date, enabled: boolean): Date {
  if (!enabled) return start;
  const day = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: IL_TZ, day: "numeric" }).format(start),
  );
  if (day < 29) return start;
  const next = new Date(start);
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  return next;
}
