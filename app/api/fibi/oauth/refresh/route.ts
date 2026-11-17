import { prisma } from "@/lib/db";
import { ApiError, errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { createFibiClient, getValidAccessToken } from "@/services/fibi";
import { z } from "zod";

const bodySchema = z.object({ bankAccountId: z.string() });

export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "MANAGE_CONNECTION", domain: "INTEGRATION" });
    const { bankAccountId } = bodySchema.parse(await request.json());
    const account = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, entityId: principal.entityId },
    });
    if (!account) throw new ApiError(404, "חשבון לא נמצא");
    const { config } = await createFibiClient();
    await getValidAccessToken(config, account.id);
    await writeAudit({
      principal,
      action: "refresh_token",
      domain: "INTEGRATION",
      recordType: "BankAccount",
      recordId: account.id,
    });
    return json({ ok: true, accessToken: "[redacted]", expiresInMinutes: 20 });
  } catch (error) {
    return errorResponse(error);
  }
}
