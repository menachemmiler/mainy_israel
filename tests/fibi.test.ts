import { describe, expect, it } from "vitest";
import { parseActionCode, sortMultiCurrency } from "@/services/fibi/parsers/transaction-codes";
import { validateBatchDraft, validateSingleDraft } from "@/services/fibi/validation/israeli-account";
import { decodeTransactionId, mockTransactionId } from "@/services/fibi/idempotency";
import { joinFibiUrl } from "@/services/fibi/config";

describe("transaction codes", () => {
  it("parses documented FIBI codes", () => {
    expect(parseActionCode("10001").family).toBe("cash_deposit");
    expect(parseActionCode("10051").family).toBe("incoming_transfer");
    expect(parseActionCode("-10040").direction).toBe("debit");
    expect(parseActionCode("-20051").family).toBe("incoming_fx");
  });

  it("sorts multi-currency by currency then date", () => {
    const sorted = sortMultiCurrency([
      { currency: "USD", valueDate: "2026-01-02" },
      { currency: "ILS", valueDate: "2026-01-03" },
      { currency: "ILS", valueDate: "2026-01-01" },
    ]);
    expect(sorted.map((r) => `${r.currency}:${r.valueDate}`)).toEqual([
      "ILS:2026-01-01",
      "ILS:2026-01-03",
      "USD:2026-01-02",
    ]);
  });
});

describe("batch validation B02", () => {
  const ok = {
    bank: "12",
    branch: "345",
    account: "12345678",
    beneficiary_name: "הסעות ברכה",
    amount: 100,
  };

  it("rejects the entire batch if one account is invalid", () => {
    const errors = validateBatchDraft({
      branchId: "001",
      accountId: "1234567",
      list_name: "משכורות",
      transfer_date: "2026-12-01",
      action_type: "Load & open draft",
      transfer_list: [ok, { ...ok, account: "ABC" }],
    });
    expect(errors.some((e) => e.path.includes("transfer_list[1]"))).toBe(true);
  });

  it("requires 2 to 99 items", () => {
    const errors = validateBatchDraft({
      branchId: "001",
      accountId: "1",
      list_name: "x",
      transfer_date: "2026-12-01",
      action_type: "Load & open draft",
      transfer_list: [ok],
    });
    expect(errors.some((e) => e.path === "transfer_list")).toBe(true);
  });
});

describe("single draft validation", () => {
  it("requires a positive amount", () => {
    const errors = validateSingleDraft({
      branchId: "001",
      accountId: "1234567",
      bank: "12",
      branch: "345",
      account: "12345678",
      beneficiary_name: "א",
      amount: 0,
      transfer_date: "2026-12-01",
    });
    expect(errors.some((e) => e.path === "amount")).toBe(true);
  });
});

describe("transaction_id", () => {
  it("round-trips base64 JSON id and timestamp", () => {
    const encoded = mockTransactionId("draft-1", new Date("2026-01-01T00:00:00Z"));
    const decoded = decodeTransactionId(encoded);
    expect(decoded?.id).toBe("draft-1");
  });
});

describe("FIBI urls", () => {
  it("joins sandbox base without duplicating slashes", () => {
    expect(joinFibiUrl("https://api.fibi.co.il:8443/fibi/sb", "/accountTransactions/branch/001/account/1")).toBe(
      "https://api.fibi.co.il:8443/fibi/sb/accountTransactions/branch/001/account/1",
    );
  });
});
