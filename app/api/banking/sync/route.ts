import { prisma } from "@/lib/db";
import { ApiError, errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { MissingBankTokenError, syncAccountTransactions } from "@/services/fibi";
import { z } from "zod";

const bodySchema = z.object({
  bankAccountId: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  accountType: z.string().optional(),
  currencyIso: z.enum(["ILS", "USD"]).optional(),
});

export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "READ", domain: "BANK" });
    const body = bodySchema.parse(await request.json());
    const account = await prisma.bankAccount.findFirst({
      where: { id: body.bankAccountId, entityId: principal.entityId },
    });
    if (!account) throw new ApiError(404, "חשבון לא נמצא");

    try {
      const result = await syncAccountTransactions(body);
      await writeAudit({
        principal,
        action: "sync_transactions",
        domain: "BANK",
        recordType: "BankAccount",
        recordId: account.id,
        after: result,
      });
      return json({ result });
    } catch (error) {
      if (error instanceof MissingBankTokenError) {
        return json(
          {
            error: "אין אסימון בנק פעיל. קריאה מדומה זמינה מנתוני הדגמה שכבר נשמרו.",
            code: "NO_TOKEN",
          },
          409,
        );
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
