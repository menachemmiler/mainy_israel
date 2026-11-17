import { FibiClient } from "../client";
import { validateSingleDraft } from "../validation/israeli-account";
import { decodeTransactionId } from "../idempotency";
import type { IsraeliTransferDraftInput, TransferDraftBankResponse } from "../types";

export async function createSingleIsraeliTransferDraft(
  client: FibiClient,
  accessToken: string,
  input: IsraeliTransferDraftInput,
): Promise<TransferDraftBankResponse> {
  const errors = validateSingleDraft(input);
  if (errors.length) {
    throw Object.assign(new Error("טיוטת ההעברה נדחתה עקב שדות לא תקינים"), { status: 400, errors });
  }

  const path = `/transfers/v2/currency/israel/branch/${encodeURIComponent(input.branchId)}/account/${encodeURIComponent(input.accountId)}/`;
  const body = {
    bank: input.bank,
    branch: input.branch,
    account: input.account,
    beneficiary_name: input.beneficiary_name,
    amount: input.amount,
    category: input.category,
    transfer_date: input.transfer_date,
    is_rtgs: input.is_rtgs ?? false,
    comment: input.comment,
    other_comment: input.other_comment,
  };

  const raw = await client.request<Record<string, unknown>>({
    method: "POST",
    path,
    accessToken,
    body,
  });

  const transactionId = typeof raw.transaction_id === "string" ? raw.transaction_id : undefined;
  return {
    transaction_id: transactionId,
    decoded: decodeTransactionId(transactionId),
    raw,
    mock: false,
  };
}
