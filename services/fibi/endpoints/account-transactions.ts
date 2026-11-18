import { FibiClient } from "../client";
import { parseActionCode, sortMultiCurrency } from "../parsers/transaction-codes";
import type { AccountTransactionsQuery, AccountTransactionsResult, FibiTransaction } from "../types";

function asArray(raw: unknown): FibiTransaction[] {
  if (Array.isArray(raw)) return raw as FibiTransaction[];
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    for (const key of ["transactions", "accountTransactions", "items", "data"]) {
      if (Array.isArray(rec[key])) return rec[key] as FibiTransaction[];
    }
  }
  return [];
}

/** Banker catalog example: DD.MM.YYYY and NIS. */
export function toFibiDate(value: string): string {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value;
  const iso = value.slice(0, 10);
  const [year, month, day] = iso.split("-");
  if (year && month && day) return `${day}.${month}.${year}`;
  return value;
}

export function toFibiCurrency(currency?: string): string | undefined {
  if (!currency) return undefined;
  return currency === "ILS" ? "NIS" : currency;
}

export async function getAccountTransactions(
  client: FibiClient,
  accessToken: string,
  query: AccountTransactionsQuery,
): Promise<AccountTransactionsResult> {
  const raw = await client.request<unknown>({
    method: "GET",
    path: "/account-transactions",
    accessToken,
    query: {
      branch_id: query.branch,
      account_id: query.account,
      start_date: toFibiDate(query.fromDate),
      end_date: toFibiDate(query.toDate),
      account_type: query.accountType,
      currency: toFibiCurrency(query.currencyIso),
    },
  });

  const transactions = sortMultiCurrency(
    asArray(raw).map((tx) => {
      const parsed = parseActionCode(tx.actionCode ?? tx.actionType);
      return {
        ...tx,
        actionCode: parsed.code,
        _parsed: parsed,
      };
    }),
  );

  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    transactions,
    openingBalance: rec.openingBalance != null ? String(rec.openingBalance) : undefined,
    closingBalance: rec.closingBalance != null ? String(rec.closingBalance) : undefined,
    currency: query.currencyIso ?? (typeof rec.currency === "string" ? rec.currency : undefined),
    raw,
  };
}
