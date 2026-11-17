import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac/engine";
import { ApiError, errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { DuplicateSubmitError, submitBatchDraft, submitSingleDraft } from "@/services/fibi";
import { BatchValidationError } from "@/services/fibi/validation/israeli-account";
import { z } from "zod";

export async function GET() {
  try {
    const principal = await requirePermission({ action: "READ", domain: "BANK" });
    const items = await prisma.transferDraft.findMany({
      where: { bankAccount: { entityId: principal.entityId } },
      include: { items: true, bankAccount: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return json({ items, writeGated: true });
  } catch (error) {
    return errorResponse(error);
  }
}

const singleSchema = z.object({
  kind: z.literal("SINGLE"),
  bankAccountId: z.string(),
  idempotencyKey: z.string().min(8),
  bank: z.string(),
  branch: z.string(),
  account: z.string(),
  beneficiary_name: z.string(),
  amount: z.union([z.number(), z.string()]),
  transfer_date: z.string(),
  category: z.string().optional(),
  is_rtgs: z.boolean().optional(),
  comment: z.string().optional(),
  other_comment: z.string().optional(),
});

const batchSchema = z.object({
  kind: z.literal("BATCH"),
  bankAccountId: z.string(),
  idempotencyKey: z.string().min(8),
  list_name: z.string(),
  list_description: z.string().optional(),
  is_salary_transfer: z.boolean().optional(),
  transfer_date: z.string(),
  category: z.string().optional(),
  transfer_list: z.array(
    z.object({
      bank: z.string(),
      branch: z.string(),
      account: z.string(),
      beneficiary_name: z.string(),
      amount: z.union([z.number(), z.string()]),
      is_rtgs: z.boolean().optional(),
      comment: z.string().optional(),
      other_comment: z.string().optional(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "CREATE", domain: "BANK" });
    if (!can(principal, "TRANSMIT_BANK", "BANK")) {
      // Transmit is a separate authority. Creating a local/mock draft is CREATE.
    }
    const raw = await request.json();
    const kind = raw.kind === "BATCH" ? "BATCH" : "SINGLE";

    try {
      if (kind === "BATCH") {
        const body = batchSchema.parse(raw);
        const result = await submitBatchDraft({
          bankAccountId: body.bankAccountId,
          idempotencyKey: body.idempotencyKey,
          actorId: principal.userId,
          input: {
            list_name: body.list_name,
            list_description: body.list_description,
            is_salary_transfer: body.is_salary_transfer,
            transfer_date: body.transfer_date,
            action_type: "Load & open draft",
            category: body.category,
            transfer_list: body.transfer_list,
          },
        });
        await writeAudit({
          principal,
          action: "prepare_batch_draft",
          domain: "BANK",
          recordType: "TransferDraft",
          recordId: result.draft.id,
          after: { mock: result.mock, transaction_id: result.transaction_id },
        });
        return json({
          ...result,
          gated: result.mock,
          notice: result.mock
            ? "בדיקת ספק / מדומה — לא נשלח לבנק. חתימה סופית רק בפורטל FIBI לאחר אימות."
            : "טיוטה נשלחה לבנק וממתינה לחתימת מורשה בפורטל.",
        });
      }

      const body = singleSchema.parse(raw);
      const result = await submitSingleDraft({
        bankAccountId: body.bankAccountId,
        idempotencyKey: body.idempotencyKey,
        actorId: principal.userId,
        input: {
          bank: body.bank,
          branch: body.branch,
          account: body.account,
          beneficiary_name: body.beneficiary_name,
          amount: body.amount,
          category: body.category,
          transfer_date: body.transfer_date,
          is_rtgs: body.is_rtgs,
          comment: body.comment,
          other_comment: body.other_comment,
        },
      });
      await writeAudit({
        principal,
        action: "prepare_single_draft",
        domain: "BANK",
        recordType: "TransferDraft",
        recordId: result.draft.id,
        after: { mock: result.mock, transaction_id: result.transaction_id },
      });
      return json({
        ...result,
        gated: result.mock,
        notice: result.mock
          ? "בדיקת ספק / מדומה — לא נשלח לבנק. חתימה סופית רק בפורטל FIBI לאחר אימות."
          : "טיוטה נשלחה לבנק וממתינה לחתימת מורשה בפורטל.",
      });
    } catch (error) {
      if (error instanceof DuplicateSubmitError) {
        throw new ApiError(409, error.message, { draftId: error.existingDraftId, status: error.status });
      }
      if (error instanceof BatchValidationError) {
        throw new ApiError(400, error.message, error.errors);
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
