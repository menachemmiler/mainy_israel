export type TransactionDirection = "credit" | "debit" | "info";
export type TransactionFamily =
  | "cash_deposit"
  | "incoming_transfer"
  | "outgoing_transfer"
  | "incoming_fx"
  | "outgoing_fx"
  | "fee"
  | "other";

export type ParsedActionCode = {
  code: string;
  numeric: number;
  direction: TransactionDirection;
  family: TransactionFamily;
  labelHe: string;
  labelEn: string;
};

const KNOWN: Record<string, Omit<ParsedActionCode, "code" | "numeric" | "direction">> = {
  "10001": { family: "cash_deposit", labelHe: "הפקדת מזומן", labelEn: "Cash deposit" },
  "10051": {
    family: "incoming_transfer",
    labelHe: "העברה נכנסת (מחוץ לקבוצה / מס״ב / זיכוי מיידי)",
    labelEn: "Incoming transfer (non-group / Masav / immediate credit)",
  },
  "-10040": { family: "outgoing_transfer", labelHe: "העברה יוצאת בשקלים", labelEn: "Outgoing ILS transfer" },
  "-20051": {
    family: "incoming_fx",
    labelHe: "העברה נכנסת במט״ח",
    labelEn: "Incoming foreign currency transfer",
  },
};

export function parseActionCode(raw: string | number | null | undefined): ParsedActionCode {
  const code = String(raw ?? "").trim() || "0";
  const numeric = Number(code);
  const known = KNOWN[code] ?? KNOWN[String(numeric)];
  const direction: TransactionDirection = Number.isFinite(numeric)
    ? numeric < 0
      ? "debit"
      : numeric > 0
        ? "credit"
        : "info"
    : "info";

  if (known) {
    return { code, numeric: Number.isFinite(numeric) ? numeric : 0, direction, ...known };
  }

  const family: TransactionFamily = !Number.isFinite(numeric)
    ? "other"
    : numeric <= -20000
      ? "outgoing_fx"
      : numeric < 0
        ? "outgoing_transfer"
        : numeric >= 20000
          ? "incoming_fx"
          : "other";

  return {
    code,
    numeric: Number.isFinite(numeric) ? numeric : 0,
    direction,
    family,
    labelHe: "פעולה אחרת",
    labelEn: "Other",
  };
}

export function sortMultiCurrency<T extends { currency?: string; valueDate?: string; registerDate?: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const cur = (a.currency ?? "ILS").localeCompare(b.currency ?? "ILS");
    if (cur !== 0) return cur;
    const da = a.valueDate ?? a.registerDate ?? "";
    const db = b.valueDate ?? b.registerDate ?? "";
    return da.localeCompare(db);
  });
}
