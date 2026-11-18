import { prisma } from "@/lib/db";
import { ApiError, errorResponse, json, requirePermission, writeAudit } from "@/lib/api/http";
import { createFibiClient, exchangeRefreshToken, storeTokenSet } from "@/services/fibi";
import { z } from "zod";

const schema = z.object({
  bankAccountId: z.string().min(1),
  refreshToken: z.string().min(8),
});

/** Spec 1.4.4 — paste the refresh token shown in the bank portal popup. */
export async function POST(request: Request) {
  try {
    const principal = await requirePermission({ action: "MANAGE_CONNECTION", domain: "INTEGRATION" });
    const body = schema.parse(await request.json());
    const account = await prisma.bankAccount.findUnique({ where: { id: body.bankAccountId } });
    if (!account) throw new ApiError(404, "חשבון לא נמצא");

    const { config } = await createFibiClient();
    const tokens = await exchangeRefreshToken(config, body.refreshToken.trim());
    await storeTokenSet({
      config,
      bankAccountId: account.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresAt: tokens.accessExpiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
      tokenType: tokens.tokenType,
    });
    await prisma.integrationConnection.updateMany({
      where: { bankAccountId: account.id },
      data: { accessExists: true, status: "CONNECTED" },
    });
    await writeAudit({
      principal,
      action: "IMPORT_REFRESH_TOKEN",
      domain: "INTEGRATION",
      recordType: "OAuthToken",
      recordId: account.id,
    });
    return json({ ok: true, refreshExpiresAt: tokens.refreshExpiresAt });
  } catch (error) {
    return errorResponse(error);
  }
}
