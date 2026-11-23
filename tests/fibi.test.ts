import { describe, expect, it } from "vitest";
import { parseActionCode, sortMultiCurrency } from "@/services/fibi/parsers/transaction-codes";
import { validateBatchDraft, validateSingleDraft } from "@/services/fibi/validation/israeli-account";
import { decodeTransactionId, mockTransactionId } from "@/services/fibi/idempotency";
import { joinFibiUrl } from "@/services/fibi/config";
import { toFibiCurrency, toFibiDate } from "@/services/fibi/endpoints/account-transactions";
import { buildAuthorizeUrl } from "@/services/fibi/auth/authorize";
import type { FibiConfig } from "@/services/fibi/types";

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
  it("joins the banker catalog account-transactions path", () => {
    expect(joinFibiUrl("https://api.fibi.co.il/fibi/prd", "/account-transactions")).toBe(
      "https://api.fibi.co.il/fibi/prd/account-transactions",
    );
  });
});

describe("FIBI query format", () => {
  it("uses DD.MM.YYYY and NIS as in the banker curl", () => {
    expect(toFibiDate("2017-04-01")).toBe("01.04.2017");
    expect(toFibiDate("01.04.2017")).toBe("01.04.2017");
    expect(toFibiCurrency("ILS")).toBe("NIS");
  });
});

describe("OAuth authorize", () => {
  it("sends state and the registered redirect url", () => {
    const config = {
      authorizeUrl: "https://api.fibi.co.il/fibi/prd/oauth/oauth2/authorize",
      clientId: "client-1",
      redirectUri: "http://localhost:3000/api/fibi/oauth/callback",
    } as FibiConfig;
    const url = new URL(buildAuthorizeUrl(config, "acct-1"));
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/fibi/oauth/callback");
    expect(url.searchParams.get("redirect_url")).toBeNull();
    expect(url.searchParams.get("state")).toBe("acct-1");
    expect(url.searchParams.get("scope")).toBeNull();
  });

  it("adds catalog scope when configured", () => {
    const config = {
      authorizeUrl: "https://api.fibi.co.il/fibi/prd/oauth/oauth2/authorize",
      clientId: "client-1",
      redirectUri: "http://localhost:3000/api/fibi/oauth/callback",
      oauthScope: "account-transactions",
    } as FibiConfig;
    const url = new URL(buildAuthorizeUrl(config, "acct-1"));
    expect(url.searchParams.get("scope")).toBe("account-transactions");
  });
});
