import { FibiClient } from "../client";
import { BatchValidationError, validateBatchDraft } from "../validation/israeli-account";
import { decodeTransactionId } from "../idempotency";
import type { BatchTransferDraftInput, TransferDraftBankResponse } from "../types";

export async function createBatchIsraeliTransferDraft(
  client: FibiClient,
  accessToken: string,
  input: BatchTransferDraftInput,
): Promise<TransferDraftBankResponse> {
  const errors = validateBatchDraft(input);
  if (errors.length) {
    throw new BatchValidationError(errors);
  }

  const path = `/transfers/v2/multiple/currency/israel/branch/${encodeURIComponent(input.branchId)}/account/${encodeURIComponent(input.accountId)}/`;
  const body = {
    list_name: input.list_name,
    list_description: input.list_description,
    is_salary_transfer: input.is_salary_transfer ?? false,
    transfer_date: input.transfer_date,
    action_type: "Load & open draft",
    category: input.category,
    transfer_list: input.transfer_list,
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
