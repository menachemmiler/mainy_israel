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

export async function getAccountTransactions(
  client: FibiClient,
  accessToken: string,
  query: AccountTransactionsQuery,
): Promise<AccountTransactionsResult> {
  const path = `/accountTransactions/branch/${encodeURIComponent(query.branch)}/account/${encodeURIComponent(query.account)}`;
  const raw = await client.request<unknown>({
    method: "GET",
    path,
    accessToken,
    query: {
      fromDate: query.fromDate,
      toDate: query.toDate,
      accountType: query.accountType,
      currencyIso: query.currencyIso,
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
