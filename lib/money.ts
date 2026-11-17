import { Decimal } from "decimal.js";

export type MoneyCurrency = "ILS" | "USD" | "EUR";

const SYMBOL: Record<MoneyCurrency, string> = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
};

export function money(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function formatMoney(
  value: Decimal.Value,
  currency: MoneyCurrency = "ILS",
  locale = "he-IL",
): string {
  const n = money(value).toNumber();
  return `${SYMBOL[currency]}${n.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Split a total into N installments.
 * Last payment absorbs the rounding remainder (Part A §5 / P02).
 * 1000 / 3 → 333.33, 333.33, 333.34
 */
export function splitInstallments(total: Decimal.Value, count: number): Decimal[] {
  if (count < 1) {
    throw new Error("Installment count must be at least 1");
  }
  const totalMoney = money(total);
  if (count === 1) return [totalMoney];

  const unit = totalMoney.div(count).toDecimalPlaces(2, Decimal.ROUND_DOWN);
  const parts = Array.from({ length: count - 1 }, () => unit);
  const remainder = totalMoney.minus(unit.times(count - 1));
  parts.push(money(remainder));

  if (remainder.lte(0)) {
    throw new Error(
      "Last installment rounded to zero or negative. Reduce the number of payments or round remaining amounts down and allocate the leftover.",
    );
  }
  return parts;
}

export function allocationsBalance(
  total: Decimal.Value,
  parts: Decimal.Value[],
): { ok: boolean; sum: Decimal; delta: Decimal } {
  const sum = parts.reduce((acc, p) => acc.plus(money(p)), money(0));
  const delta = money(total).minus(sum);
  return { ok: delta.eq(0), sum, delta };
}

export { Decimal };
