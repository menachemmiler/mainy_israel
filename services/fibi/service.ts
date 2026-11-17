import { prisma } from "@/lib/db";
import { money } from "@/lib/money";
import { loadFibiConfig } from "./config";
import { FibiClient } from "./client";
import { getAccountTransactions } from "./endpoints/account-transactions";
import { createSingleIsraeliTransferDraft } from "./endpoints/single-transfer";
import { createBatchIsraeliTransferDraft } from "./endpoints/batch-transfer";
import { BatchValidationError } from "./validation/israeli-account";
import { DuplicateSubmitError, mockTransactionId } from "./idempotency";
import { getValidAccessToken } from "./auth/token-manager";
import { parseActionCode } from "./parsers/transaction-codes";
import type {
  AccountTransactionsQuery,
  BatchTransferDraftInput,
  IsraeliTransferDraftInput,
} from "./types";
import type { Currency, TransferDraftStatus } from "@prisma/client";

const UNCLEAR_STATUSES: TransferDraftStatus[] = ["SUBMITTED", "AWAITING_BANK_VERIFY"];

export async function createFibiClient() {
  const config = await loadFibiConfig();
  return { config, client: new FibiClient(config) };
}

export async function syncAccountTransactions(opts: {
  bankAccountId: string;
  fromDate: string;
  toDate: string;
  accountType?: string;
  currencyIso?: "ILS" | "USD";
}) {
  const account = await prisma.bankAccount.findUniqueOrThrow({ where: { id: opts.bankAccountId } });
  const { config, client } = await createFibiClient();
  const accessToken = await getValidAccessToken(config, account.id);
  const query: AccountTransactionsQuery = {
    branch: account.branch,
    account: account.account,
    fromDate: opts.fromDate,
    toDate: opts.toDate,
    accountType: opts.accountType ?? account.accountType ?? undefined,
    currencyIso: opts.currencyIso ?? (account.currency === "EUR" ? undefined : account.currency),
  };
  const result = await getAccountTransactions(client, accessToken, query);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const tx of result.transactions) {
    const parsed = parseActionCode(tx.actionCode ?? tx.actionType);
    const externalId =
      String(tx.transactionCounter ?? tx.reference ?? "") ||
      `${query.fromDate}:${tx.valueDate}:${tx.amount}:${parsed.code}`;
    const amount = money(tx.amount ?? 0);
    const existing = await prisma.bankMovement.findUnique({
      where: {
        bankAccountId_provider_externalId: {
          bankAccountId: account.id,
          provider: "FIBI",
          externalId,
        },
      },
    });
    const data = {
      registerDate: new Date(String(tx.registerDate ?? tx.valueDate ?? opts.fromDate)),
      valueDate: new Date(String(tx.valueDate ?? tx.registerDate ?? opts.fromDate)),
      amount,
      currency: (tx.currency as Currency) ?? account.currency,
      actionType: tx.actionType ? String(tx.actionType) : parsed.labelEn,
      actionCode: parsed.code,
      description: tx.description ? String(tx.description) : parsed.labelHe,
      openingBalance: tx.openingBalance != null ? money(tx.openingBalance) : undefined,
      closingBalance: tx.closingBalance != null ? money(tx.closingBalance) : undefined,
      transactionCounter: tx.transactionCounter != null ? String(tx.transactionCounter) : undefined,
      contraBank: tx.contraBank ? String(tx.contraBank) : undefined,
      contraBranch: tx.contraBranch ? String(tx.contraBranch) : undefined,
      contraAccount: tx.contraAccount ? String(tx.contraAccount) : undefined,
      beneficiaryName: tx.beneficiaryName ? String(tx.beneficiaryName) : undefined,
      transactionReason: tx.transactionReason ? String(tx.transactionReason) : undefined,
      reference: tx.reference ? String(tx.reference) : undefined,
      rawPayload: tx as object,
    };
    if (existing) {
      await prisma.bankMovement.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.bankMovement.create({
        data: {
          bankAccountId: account.id,
          provider: "FIBI",
          externalId,
          ...data,
        },
      });
      inserted += 1;
    }
  }

  await prisma.bankAccount.update({
    where: { id: account.id },
    data: {
      lastSyncedAt: new Date(),
      currentBalance: result.closingBalance != null ? money(result.closingBalance) : account.currentBalance,
      balanceAsOf: new Date(),
    },
  });

  return { inserted, updated, skipped, count: result.transactions.length, writeMode: config.writeMode };
}

export async function submitSingleDraft(opts: {
  bankAccountId: string;
  idempotencyKey: string;
  input: Omit<IsraeliTransferDraftInput, "branchId" | "accountId">;
  actorId?: string;
}) {
  const account = await prisma.bankAccount.findUniqueOrThrow({ where: { id: opts.bankAccountId } });
  await assertNoUnclearSubmit(account.id, opts.idempotencyKey);

  const { config, client } = await createFibiClient();
  const payload: IsraeliTransferDraftInput = {
    ...opts.input,
    branchId: account.branch,
    accountId: account.account,
  };

  const existing = await prisma.transferDraft.findUnique({
    where: { bankAccountId_idempotencyKey: { bankAccountId: account.id, idempotencyKey: opts.idempotencyKey } },
  });
  if (existing && UNCLEAR_STATUSES.includes(existing.status)) {
    throw new DuplicateSubmitError("ממתין לאימות בבנק. אין לשלוח טיוטה נוספת.", existing.id, existing.status);
  }

  const draft = existing
    ? await prisma.transferDraft.update({
        where: { id: existing.id },
        data: {
          amount: money(opts.input.amount),
          transferDate: new Date(opts.input.transfer_date),
          category: opts.input.category,
          status: "VALIDATING",
        },
      })
    : await prisma.transferDraft.create({
        data: {
          bankAccountId: account.id,
          kind: "SINGLE",
          status: "VALIDATING",
          writeMode: config.writeMode === "live" ? "LIVE" : "MOCK",
          idempotencyKey: opts.idempotencyKey,
          transferDate: new Date(opts.input.transfer_date),
          category: opts.input.category,
          amount: money(opts.input.amount),
          currency: account.currency,
          createdById: opts.actorId,
          items: {
            create: {
              lineNo: 1,
              bank: opts.input.bank,
              branch: opts.input.branch,
              account: opts.input.account,
              beneficiaryName: opts.input.beneficiary_name,
              amount: money(opts.input.amount),
              isRtgs: opts.input.is_rtgs ?? false,
              comment: opts.input.comment,
              otherComment: opts.input.other_comment,
            },
          },
        },
      });

  if (config.writeMode !== "live") {
    const transactionId = mockTransactionId(draft.id);
    const updated = await prisma.transferDraft.update({
      where: { id: draft.id },
      data: {
        status: "MOCK_PREPARED",
        writeMode: "MOCK",
        bankTransactionId: transactionId,
        lastSubmitAt: new Date(),
        bankResponse: { mock: true, note: "FIBI_WRITE_MODE=mock — לא נשלח לבנק" },
      },
    });
    return { draft: updated, mock: true, transaction_id: transactionId };
  }

  const accessToken = await getValidAccessToken(config, account.id);
  try {
    await prisma.transferDraft.update({
      where: { id: draft.id },
      data: { status: "AWAITING_BANK_VERIFY", lastSubmitAt: new Date() },
    });
    const response = await createSingleIsraeliTransferDraft(client, accessToken, payload);
    const updated = await prisma.transferDraft.update({
      where: { id: draft.id },
      data: {
        status: "AWAITING_SIGNATURES",
        bankTransactionId: response.transaction_id,
        bankResponse: response.raw as object,
      },
    });
    return { draft: updated, mock: false, transaction_id: response.transaction_id };
  } catch (error) {
    await prisma.transferDraft.update({
      where: { id: draft.id },
      data: { status: "AWAITING_BANK_VERIFY", bankResponse: { error: String(error) } },
    });
    throw error;
  }
}

export async function submitBatchDraft(opts: {
  bankAccountId: string;
  idempotencyKey: string;
  input: Omit<BatchTransferDraftInput, "branchId" | "accountId">;
  actorId?: string;
}) {
  const account = await prisma.bankAccount.findUniqueOrThrow({ where: { id: opts.bankAccountId } });
  await assertNoUnclearSubmit(account.id, opts.idempotencyKey);

  const { config, client } = await createFibiClient();
  const payload: BatchTransferDraftInput = {
    ...opts.input,
    branchId: account.branch,
    accountId: account.account,
    action_type: "Load & open draft",
  };

  const errors = (await import("./validation/israeli-account")).validateBatchDraft(payload);
  if (errors.length) throw new BatchValidationError(errors);

  const amount = payload.transfer_list.reduce((sum, item) => sum.plus(money(item.amount)), money(0));
  const draft = await prisma.transferDraft.upsert({
    where: { bankAccountId_idempotencyKey: { bankAccountId: account.id, idempotencyKey: opts.idempotencyKey } },
    update: {
      amount,
      listName: payload.list_name,
      listDescription: payload.list_description,
      isSalaryTransfer: payload.is_salary_transfer ?? false,
      transferDate: new Date(payload.transfer_date),
      status: "VALIDATING",
      items: {
        deleteMany: {},
        create: payload.transfer_list.map((item, i) => ({
          lineNo: i + 1,
          bank: item.bank,
          branch: item.branch,
          account: item.account,
          beneficiaryName: item.beneficiary_name,
          amount: money(item.amount),
          isRtgs: item.is_rtgs ?? false,
          comment: item.comment,
          otherComment: item.other_comment,
        })),
      },
    },
    create: {
      bankAccountId: account.id,
      kind: "BATCH",
      status: "VALIDATING",
      writeMode: config.writeMode === "live" ? "LIVE" : "MOCK",
      idempotencyKey: opts.idempotencyKey,
      listName: payload.list_name,
      listDescription: payload.list_description,
      isSalaryTransfer: payload.is_salary_transfer ?? false,
      transferDate: new Date(payload.transfer_date),
      category: payload.category,
      amount,
      currency: account.currency,
      createdById: opts.actorId,
      items: {
        create: payload.transfer_list.map((item, i) => ({
          lineNo: i + 1,
          bank: item.bank,
          branch: item.branch,
          account: item.account,
          beneficiaryName: item.beneficiary_name,
          amount: money(item.amount),
          isRtgs: item.is_rtgs ?? false,
          comment: item.comment,
          otherComment: item.other_comment,
        })),
      },
    },
  });

  if (config.writeMode !== "live") {
    const transactionId = mockTransactionId(draft.id);
    const updated = await prisma.transferDraft.update({
      where: { id: draft.id },
      data: {
        status: "MOCK_PREPARED",
        bankTransactionId: transactionId,
        lastSubmitAt: new Date(),
        bankResponse: { mock: true, note: "FIBI_WRITE_MODE=mock — לא נשלח לבנק" },
      },
    });
    return { draft: updated, mock: true, transaction_id: transactionId };
  }

  const accessToken = await getValidAccessToken(config, account.id);
  try {
    await prisma.transferDraft.update({
      where: { id: draft.id },
      data: { status: "AWAITING_BANK_VERIFY", lastSubmitAt: new Date() },
    });
    const response = await createBatchIsraeliTransferDraft(client, accessToken, payload);
    const updated = await prisma.transferDraft.update({
      where: { id: draft.id },
      data: {
        status: "AWAITING_SIGNATURES",
        bankTransactionId: response.transaction_id,
        bankResponse: response.raw as object,
      },
    });
    return { draft: updated, mock: false, transaction_id: response.transaction_id };
  } catch (error) {
    await prisma.transferDraft.update({
      where: { id: draft.id },
      data: { status: "AWAITING_BANK_VERIFY", bankResponse: { error: String(error) } },
    });
    throw error;
  }
}

async function assertNoUnclearSubmit(bankAccountId: string, idempotencyKey: string) {
  const unclear = await prisma.transferDraft.findFirst({
    where: {
      bankAccountId,
      idempotencyKey,
      status: { in: UNCLEAR_STATUSES },
    },
  });
  if (unclear) {
    throw new DuplicateSubmitError(
      "מצב בירור: תשובת הבנק לא אומתה. אין ליצור טיוטה נוספת.",
      unclear.id,
      unclear.status,
    );
  }
}
